from django.db import transaction
from rest_framework import serializers

from core.workflow import validar_transicion_estado
from inventory.models import InventarioMovimiento
from inventory.services import crear_entradas_por_compra

from .models import Compra, CompraItem


def compra_requiere_ingreso_stock(estado_anterior, estado_nuevo):
    return estado_anterior != Compra.Estado.RECIBIDA and estado_nuevo == Compra.Estado.RECIBIDA


def actualizar_compra_con_stock(serializer, usuario):
    compra = serializer.instance
    estado_anterior = compra.estado
    estado_nuevo = serializer.validated_data.get('estado', estado_anterior)
    requiere_ingreso = compra_requiere_ingreso_stock(estado_anterior, estado_nuevo)

    with transaction.atomic():
        compra_bloqueada = (
            Compra.objects.select_for_update()
            .select_related('tenant')
            .prefetch_related('items__producto')
            .get(pk=compra.pk)
        )
        serializer.instance = compra_bloqueada

        estado_anterior = compra_bloqueada.estado
        estado_nuevo = serializer.validated_data.get('estado', estado_anterior)
        validar_transicion_estado('Compra', estado_anterior, estado_nuevo)

        items_bloqueados = list(
            CompraItem.objects.select_for_update()
            .select_related('producto')
            .filter(compra=compra_bloqueada)
            .order_by('id')
        )

        if compra_bloqueada.estado == Compra.Estado.RECIBIDA and 'items' in serializer.validated_data:
            raise serializers.ValidationError(
                {'detail': 'No se pueden modificar productos de una compra ya recibida.'}
            )

        compra_actualizada = serializer.save()
        movimientos = []

        if requiere_ingreso and not _compra_tiene_ingreso_automatico(compra_actualizada):
            sucursal = _obtener_sucursal_para_compra(usuario)
            items_actualizados = list(
                CompraItem.objects.select_for_update()
                .select_related('producto')
                .filter(compra=compra_actualizada)
                .order_by('id')
            )
            movimientos = crear_entradas_por_compra(
                compra=compra_actualizada,
                sucursal=sucursal,
                usuario=usuario,
                items=items_actualizados or items_bloqueados,
            )

        return compra_actualizada, movimientos


def _compra_tiene_ingreso_automatico(compra):
    return InventarioMovimiento.objects.filter(
        tenant=compra.tenant,
        tipo_movimiento=InventarioMovimiento.TipoMovimiento.ENTRADA,
        motivo=f'Entrada automática por compra #{compra.id}',
    ).exists()


def _obtener_sucursal_para_compra(usuario):
    sucursal = getattr(usuario, 'sucursal_principal', None)
    tenant = getattr(usuario, 'tenant', None)
    if sucursal is None or tenant is None or sucursal.tenant_id != tenant.id:
        raise serializers.ValidationError(
            {'detail': 'El usuario debe tener una sucursal principal válida.'}
        )
    return sucursal
