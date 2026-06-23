from decimal import Decimal

from django.db.models import DecimalField, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import serializers

from core.workflow import validar_transicion_estado

from .models import CajaMovimiento, CajaSession


PREFIJO_INGRESO_AUTOMATICO_PAGO = 'Ingreso automático por pago #'


def actualizar_caja_con_workflow(serializer):
    caja = (
        CajaSession.objects.select_for_update()
        .select_related('tenant', 'sucursal', 'usuario')
        .get(pk=serializer.instance.pk)
    )
    serializer.instance = caja

    estado_anterior = caja.estado
    estado_nuevo = serializer.validated_data.get('estado', estado_anterior)
    validar_transicion_estado('CajaSession', estado_anterior, estado_nuevo)
    instance = serializer.save()
    resumen = calcular_resumen_caja(instance)
    return instance, resumen


def calcular_resumen_caja(caja_session):
    movimientos = CajaMovimiento.objects.filter(
        tenant=caja_session.tenant,
        caja_session=caja_session,
    )
    ingresos_automaticos = _sumar_movimientos(
        movimientos.filter(
            tipo=CajaMovimiento.Tipo.INGRESO,
            descripcion__startswith=PREFIJO_INGRESO_AUTOMATICO_PAGO,
        )
    )
    ingresos_manuales = _sumar_movimientos(
        movimientos.filter(tipo=CajaMovimiento.Tipo.INGRESO).exclude(
            descripcion__startswith=PREFIJO_INGRESO_AUTOMATICO_PAGO,
        )
    )
    egresos = _sumar_movimientos(movimientos.filter(tipo=CajaMovimiento.Tipo.EGRESO))
    ajustes = _sumar_movimientos(movimientos.filter(tipo=CajaMovimiento.Tipo.AJUSTE))

    saldo_inicial = caja_session.saldo_inicial or Decimal('0.00')
    saldo_contado = caja_session.saldo_final
    saldo_esperado = saldo_inicial + ingresos_automaticos + ingresos_manuales - egresos
    diferencia = None if saldo_contado is None else saldo_contado - saldo_esperado

    return {
        'saldo_inicial': _decimal_to_string(saldo_inicial),
        'ingresos_automaticos': _decimal_to_string(ingresos_automaticos),
        'ingresos_manuales': _decimal_to_string(ingresos_manuales),
        'egresos': _decimal_to_string(egresos),
        'ajustes': _decimal_to_string(ajustes),
        'saldo_esperado': _decimal_to_string(saldo_esperado),
        'saldo_contado': _decimal_to_string(saldo_contado),
        'diferencia': _decimal_to_string(diferencia),
    }


def obtener_caja_activa_para_pago(pago, usuario):
    cajas = list(
        CajaSession.objects.select_for_update()
        .filter(
            tenant=pago.tenant,
            sucursal=pago.pedido.sucursal,
            usuario=usuario,
            estado=CajaSession.Estado.ABIERTA,
        )
        .order_by('id')
    )

    if not cajas:
        raise serializers.ValidationError(
            {'detail': 'No existe una caja abierta para registrar el ingreso del pago.'}
        )

    if len(cajas) > 1:
        raise serializers.ValidationError(
            {
                'detail': (
                    'Existe más de una caja abierta para la sucursal y usuario. '
                    'No se puede registrar el ingreso automáticamente.'
                )
            }
        )

    return cajas[0]


def pago_tiene_ingreso_caja(pago):
    return CajaMovimiento.objects.filter(
        tenant=pago.tenant,
        tipo=CajaMovimiento.Tipo.INGRESO,
        descripcion=f'{PREFIJO_INGRESO_AUTOMATICO_PAGO}{pago.id}',
    ).exists()


def crear_ingreso_por_pago(pago, caja_session, usuario):
    return CajaMovimiento.objects.create(
        tenant=pago.tenant,
        caja_session=caja_session,
        tipo=CajaMovimiento.Tipo.INGRESO,
        monto=pago.monto,
        descripcion=f'{PREFIJO_INGRESO_AUTOMATICO_PAGO}{pago.id}',
        usuario=usuario,
    )


def validar_caja_abierta_para_movimiento(caja_session):
    if caja_session.estado != CajaSession.Estado.ABIERTA:
        raise serializers.ValidationError(
            {
                'caja_session': (
                    'No se pueden crear o modificar movimientos de una caja cerrada.'
                )
            }
        )


def _sumar_movimientos(queryset):
    return queryset.aggregate(
        total=Coalesce(
            Sum('monto'),
            Value(Decimal('0.00')),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )
    )['total']


def _decimal_to_string(value):
    if value is None:
        return None
    return str(value)
