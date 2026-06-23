from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIRequestFactory
from rest_framework.test import APIClient

from accounts.models import Usuario
from audit.models import AuditLog
from tenants.models import Sucursal, Tenant

from .models import CajaMovimiento, CajaSession
from .serializers import CajaMovimientoSerializer
from .services import PREFIJO_INGRESO_AUTOMATICO_PAGO


class CashHardeningTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Empresa A',
            razon_social='Empresa A SA',
            cuit='50-00000001-1',
        )
        self.otro_tenant = Tenant.objects.create(
            nombre='Empresa B',
            razon_social='Empresa B SA',
            cuit='50-00000002-2',
        )
        self.sucursal = Sucursal.objects.create(tenant=self.tenant, nombre='Central')
        self.otra_sucursal = Sucursal.objects.create(
            tenant=self.otro_tenant,
            nombre='Central',
        )
        self.user = Usuario.objects.create_user(
            username='caja',
            password='test',
            tenant=self.tenant,
            is_superuser=True,
        )
        self.otra_caja = CajaSession.objects.create(
            tenant=self.otro_tenant,
            sucursal=self.otra_sucursal,
            usuario=self.user,
            saldo_inicial=Decimal('100.00'),
        )
        request = APIRequestFactory().post('/api/movimientos-caja/')
        request.user = self.user
        self.context = {'request': request}

    def test_rechaza_caja_de_otro_tenant(self):
        serializer = CajaMovimientoSerializer(
            data={
                'caja_session': self.otra_caja.id,
                'tipo': 'ingreso',
                'monto': '100.00',
                'descripcion': 'Test',
            },
            context=self.context,
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('caja_session', serializer.errors)


class CajaAperturaApiTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Empresa Apertura',
            razon_social='Empresa Apertura SA',
            cuit='50-00000005-1',
        )
        self.sucursal = Sucursal.objects.create(tenant=self.tenant, nombre='Central')
        self.user = Usuario.objects.create_user(
            username='apertura',
            password='test',
            tenant=self.tenant,
            sucursal_principal=self.sucursal,
            is_superuser=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_apertura_usa_tenant_usuario_y_sucursal_principal(self):
        response = self.client.post(
            '/api/cajas/',
            {'saldo_inicial': '250.00'},
            format='json',
        )

        self.assertEqual(response.status_code, 201, response.data)
        caja = CajaSession.objects.get()
        self.assertEqual(caja.tenant, self.tenant)
        self.assertEqual(caja.sucursal, self.sucursal)
        self.assertEqual(caja.usuario, self.user)

    def test_apertura_sin_sucursal_devuelve_error_claro(self):
        self.user.sucursal_principal = None
        self.user.save(update_fields=['sucursal_principal'])

        response = self.client.post(
            '/api/cajas/',
            {'saldo_inicial': '250.00'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('sucursal', response.data)
        self.assertIn(
            'Tu usuario no tiene una sucursal asignada. Pedile a un administrador que configure tu sucursal.',
            str(response.data['sucursal']),
        )
        self.assertFalse(CajaSession.objects.exists())

    def test_apertura_sin_tenant_devuelve_400(self):
        self.user.tenant = None
        self.user.save(update_fields=['tenant'])

        response = self.client.post(
            '/api/cajas/',
            {'saldo_inicial': '250.00'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('El usuario autenticado debe tener una empresa asociada.', str(response.data))
        self.assertFalse(CajaSession.objects.exists())


class CajaWorkflowTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Empresa Caja',
            razon_social='Empresa Caja SA',
            cuit='50-00000003-1',
        )
        self.sucursal = Sucursal.objects.create(tenant=self.tenant, nombre='Central')
        self.user = Usuario.objects.create_user(
            username='caja-workflow',
            password='test',
            tenant=self.tenant,
            is_superuser=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_abierta_a_cerrada_es_valida(self):
        caja = self._crear_caja()

        response = self.client.patch(
            f'/api/cajas/{caja.id}/',
            {
                'estado': CajaSession.Estado.CERRADA,
                'saldo_final': '150.00',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        caja.refresh_from_db()
        self.assertEqual(caja.estado, CajaSession.Estado.CERRADA)
        self.assertIn('resumen_conciliacion', response.data)

    def test_cerrada_a_abierta_es_transicion_invalida(self):
        caja = self._crear_caja(
            estado=CajaSession.Estado.CERRADA,
            saldo_final=Decimal('100.00'),
        )

        response = self.client.patch(
            f'/api/cajas/{caja.id}/',
            {'estado': CajaSession.Estado.ABIERTA},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('Transición inválida para CajaSession', str(response.data['estado']))
        caja.refresh_from_db()
        self.assertEqual(caja.estado, CajaSession.Estado.CERRADA)

    def _crear_caja(
        self,
        estado=CajaSession.Estado.ABIERTA,
        saldo_final=None,
    ):
        return CajaSession.objects.create(
            tenant=self.tenant,
            sucursal=self.sucursal,
            usuario=self.user,
            saldo_inicial=Decimal('100.00'),
            saldo_final=saldo_final,
            estado=estado,
        )


class CajaConciliacionTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            nombre='Empresa Conciliacion',
            razon_social='Empresa Conciliacion SA',
            cuit='50-00000004-1',
        )
        self.sucursal = Sucursal.objects.create(tenant=self.tenant, nombre='Central')
        self.user = Usuario.objects.create_user(
            username='conciliacion',
            password='test',
            tenant=self.tenant,
            is_superuser=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_cierre_calcula_saldo_esperado_correctamente(self):
        caja = self._crear_caja(saldo_inicial=Decimal('100.00'))
        self._crear_movimiento(caja, CajaMovimiento.Tipo.INGRESO, Decimal('50.00'))
        self._crear_movimiento(caja, CajaMovimiento.Tipo.EGRESO, Decimal('20.00'))

        response = self._cerrar_caja(caja, saldo_final='130.00')

        resumen = response.data['resumen_conciliacion']
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(resumen['saldo_inicial'], '100.00')
        self.assertEqual(resumen['saldo_esperado'], '130.00')
        self.assertEqual(resumen['saldo_contado'], '130.00')

    def test_ingresos_automaticos_separados_de_manuales(self):
        caja = self._crear_caja()
        self._crear_movimiento(
            caja,
            CajaMovimiento.Tipo.INGRESO,
            Decimal('70.00'),
            descripcion=f'{PREFIJO_INGRESO_AUTOMATICO_PAGO}1',
        )
        self._crear_movimiento(
            caja,
            CajaMovimiento.Tipo.INGRESO,
            Decimal('30.00'),
            descripcion='Ingreso manual',
        )

        response = self._cerrar_caja(caja, saldo_final='200.00')

        resumen = response.data['resumen_conciliacion']
        self.assertEqual(resumen['ingresos_automaticos'], '70.00')
        self.assertEqual(resumen['ingresos_manuales'], '30.00')

    def test_egresos_restan_y_ajustes_quedan_separados(self):
        caja = self._crear_caja(saldo_inicial=Decimal('100.00'))
        self._crear_movimiento(caja, CajaMovimiento.Tipo.INGRESO, Decimal('100.00'))
        self._crear_movimiento(caja, CajaMovimiento.Tipo.EGRESO, Decimal('40.00'))
        self._crear_movimiento(caja, CajaMovimiento.Tipo.AJUSTE, Decimal('999.00'))

        response = self._cerrar_caja(caja, saldo_final='160.00')

        resumen = response.data['resumen_conciliacion']
        self.assertEqual(resumen['egresos'], '40.00')
        self.assertEqual(resumen['ajustes'], '999.00')
        self.assertEqual(resumen['saldo_esperado'], '160.00')

    def test_diferencia_positiva(self):
        caja = self._crear_caja(saldo_inicial=Decimal('100.00'))

        response = self._cerrar_caja(caja, saldo_final='120.00')

        self.assertEqual(response.data['resumen_conciliacion']['diferencia'], '20.00')

    def test_diferencia_negativa(self):
        caja = self._crear_caja(saldo_inicial=Decimal('100.00'))

        response = self._cerrar_caja(caja, saldo_final='80.00')

        self.assertEqual(response.data['resumen_conciliacion']['diferencia'], '-20.00')

    def test_diferencia_cero(self):
        caja = self._crear_caja(saldo_inicial=Decimal('100.00'))

        response = self._cerrar_caja(caja, saldo_final='100.00')

        self.assertEqual(response.data['resumen_conciliacion']['diferencia'], '0.00')

    def test_cierre_sin_saldo_final_devuelve_400(self):
        caja = self._crear_caja()

        response = self.client.patch(
            f'/api/cajas/{caja.id}/',
            {'estado': CajaSession.Estado.CERRADA},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('saldo_final', response.data)

    def test_no_se_puede_crear_movimiento_en_caja_cerrada(self):
        caja = self._crear_caja(
            estado=CajaSession.Estado.CERRADA,
            saldo_final=Decimal('100.00'),
        )

        response = self.client.post(
            '/api/movimientos-caja/',
            {
                'caja_session': caja.id,
                'tipo': CajaMovimiento.Tipo.INGRESO,
                'monto': '10.00',
                'descripcion': 'Movimiento tardio',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(CajaMovimiento.objects.exists())

    def test_no_se_puede_editar_movimiento_de_caja_cerrada(self):
        caja = self._crear_caja()
        movimiento = self._crear_movimiento(caja, CajaMovimiento.Tipo.INGRESO, Decimal('10.00'))
        caja.estado = CajaSession.Estado.CERRADA
        caja.saldo_final = Decimal('110.00')
        caja.save(update_fields=['estado', 'saldo_final'])

        response = self.client.patch(
            f'/api/movimientos-caja/{movimiento.id}/',
            {'monto': '20.00'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        movimiento.refresh_from_db()
        self.assertEqual(movimiento.monto, Decimal('10.00'))

    def test_auditoria_incluye_resumen_de_conciliacion(self):
        caja = self._crear_caja()

        response = self._cerrar_caja(caja, saldo_final='100.00')

        self.assertEqual(response.status_code, 200, response.data)
        audit = AuditLog.objects.get(accion='cierre_caja')
        self.assertIn('resumen_conciliacion', audit.datos_nuevos)
        self.assertEqual(
            audit.datos_nuevos['resumen_conciliacion']['diferencia'],
            '0.00',
        )

    def test_movimientos_de_otra_caja_no_impactan(self):
        caja = self._crear_caja(saldo_inicial=Decimal('100.00'))
        otra_caja = self._crear_caja(saldo_inicial=Decimal('500.00'))
        self._crear_movimiento(otra_caja, CajaMovimiento.Tipo.INGRESO, Decimal('999.00'))

        response = self._cerrar_caja(caja, saldo_final='100.00')

        resumen = response.data['resumen_conciliacion']
        self.assertEqual(resumen['ingresos_manuales'], '0.00')
        self.assertEqual(resumen['saldo_esperado'], '100.00')

    def _crear_caja(
        self,
        saldo_inicial=Decimal('100.00'),
        estado=CajaSession.Estado.ABIERTA,
        saldo_final=None,
    ):
        return CajaSession.objects.create(
            tenant=self.tenant,
            sucursal=self.sucursal,
            usuario=self.user,
            saldo_inicial=saldo_inicial,
            estado=estado,
            saldo_final=saldo_final,
        )

    def _crear_movimiento(self, caja, tipo, monto, descripcion='Movimiento'):
        return CajaMovimiento.objects.create(
            tenant=self.tenant,
            caja_session=caja,
            tipo=tipo,
            monto=monto,
            descripcion=descripcion,
            usuario=self.user,
        )

    def _cerrar_caja(self, caja, saldo_final):
        return self.client.patch(
            f'/api/cajas/{caja.id}/',
            {
                'estado': CajaSession.Estado.CERRADA,
                'saldo_final': saldo_final,
            },
            format='json',
        )
