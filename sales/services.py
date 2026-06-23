from collections import defaultdict

from django.db import transaction
from rest_framework import serializers

from cash.services import (
    crear_ingreso_por_pago,
    obtener_caja_activa_para_pago,
    pago_tiene_ingreso_caja,
)
from core.workflow import validar_transicion_estado
from inventory.services import crear_salidas_por_pedido, validar_stock_suficiente
from products.models import Producto

from .models import Pago, Pedido


ESTADOS_CERRADOS = {
    Pedido.Estado.ENTREGADO,
    Pedido.Estado.FINALIZADO,
}


def pedido_requiere_descuento_stock(estado_anterior, estado_nuevo):
    return estado_anterior not in ESTADOS_CERRADOS and estado_nuevo in ESTADOS_CERRADOS


def pago_requiere_ingreso_caja(estado_anterior, estado_nuevo):
    return estado_anterior != Pago.Estado.APROBADO and estado_nuevo == Pago.Estado.APROBADO


def validar_edicion_pedido_cerrado(pedido, validated_data):
    if pedido.estado not in ESTADOS_CERRADOS:
        return

    cambia_sucursal = (
        'sucursal' in validated_data
        and validated_data['sucursal'].id != pedido.sucursal_id
    )
    cambia_items = 'items' in validated_data

    if cambia_sucursal or cambia_items:
        raise serializers.ValidationError(
            {
                'detail': (
                    'No se pueden modificar productos o sucursal de un pedido ya '
                    'entregado o finalizado.'
                )
            }
        )


def actualizar_pedido_con_stock(serializer, usuario):
    pedido = serializer.instance
    estado_anterior = pedido.estado
    estado_nuevo = serializer.validated_data.get('estado', estado_anterior)
    requiere_descuento = pedido_requiere_descuento_stock(estado_anterior, estado_nuevo)

    with transaction.atomic():
        pedido_bloqueado = (
            Pedido.objects.select_for_update()
            .select_related('tenant', 'sucursal')
            .prefetch_related('items__producto')
            .get(pk=pedido.pk)
        )
        serializer.instance = pedido_bloqueado

        estado_anterior = pedido_bloqueado.estado
        estado_nuevo = serializer.validated_data.get('estado', estado_anterior)
        validar_transicion_estado('Pedido', estado_anterior, estado_nuevo)
        validar_edicion_pedido_cerrado(pedido_bloqueado, serializer.validated_data)

        productos_bloqueados = []
        if requiere_descuento:
            requeridos_por_producto = _obtener_requeridos_por_producto(
                pedido_bloqueado,
                serializer.validated_data,
            )
            productos_bloqueados = list(
                Producto.objects.select_for_update()
                .filter(
                    tenant=pedido_bloqueado.tenant,
                    id__in=requeridos_por_producto.keys(),
                )
                .order_by('id')
            )
            productos_por_id = {
                producto.id: producto
                for producto in productos_bloqueados
            }
            validar_stock_suficiente(
                tenant=pedido_bloqueado.tenant,
                sucursal=serializer.validated_data.get(
                    'sucursal',
                    pedido_bloqueado.sucursal,
                ),
                requeridos_por_producto=requeridos_por_producto,
                productos_por_id=productos_por_id,
            )

        pedido_actualizado = serializer.save()
        movimientos = []
        if requiere_descuento:
            movimientos = crear_salidas_por_pedido(pedido_actualizado, usuario)

        return pedido_actualizado, movimientos


def actualizar_pago_con_caja(serializer, usuario):
    pago = serializer.instance

    with transaction.atomic():
        pago_bloqueado = (
            Pago.objects.select_for_update()
            .select_related('tenant', 'pedido__sucursal')
            .get(pk=pago.pk)
        )
        serializer.instance = pago_bloqueado

        estado_anterior = pago_bloqueado.estado
        estado_nuevo = serializer.validated_data.get('estado', estado_anterior)
        validar_transicion_estado('Pago', estado_anterior, estado_nuevo)
        requiere_ingreso = pago_requiere_ingreso_caja(estado_anterior, estado_nuevo)
        tiene_ingreso = pago_tiene_ingreso_caja(pago_bloqueado)

        caja_session = None
        if requiere_ingreso and not tiene_ingreso:
            caja_session = obtener_caja_activa_para_pago(pago_bloqueado, usuario)

        pago_actualizado = serializer.save()
        movimiento = None
        if requiere_ingreso and not tiene_ingreso:
            movimiento = crear_ingreso_por_pago(
                pago=pago_actualizado,
                caja_session=caja_session,
                usuario=usuario,
            )

        return pago_actualizado, movimiento


def _obtener_requeridos_por_producto(pedido, validated_data):
    requeridos = defaultdict(lambda: 0)
    items_data = validated_data.get('items')

    if items_data is None:
        for item in pedido.items.all():
            requeridos[item.producto_id] += item.cantidad
    else:
        for item in items_data:
            producto = item['producto']
            requeridos[producto.id] += item['cantidad']

    return dict(requeridos)
