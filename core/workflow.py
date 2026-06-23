from rest_framework import serializers

from cash.models import CajaSession
from purchases.models import Compra
from sales.models import Pago, Pedido


TRANSICIONES_PERMITIDAS = {
    'Pedido': {
        Pedido.Estado.PENDIENTE: {
            Pedido.Estado.EN_PREPARACION,
            Pedido.Estado.CANCELADO,
        },
        Pedido.Estado.EN_PREPARACION: {
            Pedido.Estado.LISTO,
            Pedido.Estado.CANCELADO,
        },
        Pedido.Estado.LISTO: {
            Pedido.Estado.EN_CAMINO,
        },
        Pedido.Estado.EN_CAMINO: {
            Pedido.Estado.ENTREGADO,
        },
        Pedido.Estado.ENTREGADO: {
            Pedido.Estado.FINALIZADO,
        },
        Pedido.Estado.FINALIZADO: set(),
        Pedido.Estado.CANCELADO: set(),
    },
    'Pago': {
        Pago.Estado.PENDIENTE: {
            Pago.Estado.APROBADO,
            Pago.Estado.RECHAZADO,
        },
        Pago.Estado.APROBADO: {
            Pago.Estado.REINTEGRADO,
        },
        Pago.Estado.RECHAZADO: set(),
        Pago.Estado.REINTEGRADO: set(),
    },
    'Compra': {
        Compra.Estado.PENDIENTE: {
            Compra.Estado.APROBADA,
            Compra.Estado.RECHAZADA,
        },
        Compra.Estado.APROBADA: {
            Compra.Estado.RECIBIDA,
        },
        Compra.Estado.RECHAZADA: set(),
        Compra.Estado.RECIBIDA: set(),
    },
    'CajaSession': {
        CajaSession.Estado.ABIERTA: {
            CajaSession.Estado.CERRADA,
        },
        CajaSession.Estado.CERRADA: set(),
    },
}


def validar_transicion_estado(recurso, estado_anterior, estado_nuevo):
    if estado_anterior == estado_nuevo:
        return

    permitidas = TRANSICIONES_PERMITIDAS[recurso].get(estado_anterior, set())
    if estado_nuevo in permitidas:
        return

    raise serializers.ValidationError(
        {
            'estado': (
                f'Transición inválida para {recurso}: '
                f'{estado_anterior} -> {estado_nuevo}.'
            )
        }
    )
