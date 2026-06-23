from decimal import Decimal
from datetime import timedelta
from types import SimpleNamespace

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.models import Rol, UserRole, Usuario
from audit.models import AuditLog
from cash.models import CajaMovimiento, CajaSession
from cash.serializers import CajaMovimientoSerializer
from inventory.models import InventarioMovimiento
from inventory.serializers import InventarioMovimientoSerializer
from products.models import Categoria, Producto
from purchases.models import Compra, CompraItem, Proveedor
from purchases.serializers import CompraSerializer
from purchases.services import actualizar_compra_con_stock
from sales.models import Cliente, Pago, Pedido, PedidoItem
from sales.serializers import PagoSerializer, PedidoSerializer
from sales.services import actualizar_pago_con_caja, actualizar_pedido_con_stock
from tenants.models import Sucursal, Tenant


DEMO_TENANT = 'AxisFood Demo'
DEMO_PASSWORD = 'Demo12345!'
DEMO_USERNAMES = (
    'axisfood_demo_admin',
    'axisfood_demo_gerente',
    'axisfood_demo_operador',
)


class Command(BaseCommand):
    help = 'Crea datos demo profesionales para mostrar AxisFood end-to-end.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Borra solamente los datos del tenant AxisFood Demo antes de sembrar.',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self._reset_demo()

        call_command('seed_rbac', verbosity=0)

        tenant, sucursal = self._crear_tenant_y_sucursal()
        usuarios = self._crear_usuarios(tenant, sucursal)
        admin = usuarios['admin']

        categorias = self._crear_categorias(tenant)
        productos = self._crear_productos(tenant, categorias)
        proveedores = self._crear_proveedores(tenant)
        clientes = self._crear_clientes(tenant)
        caja = self._obtener_o_crear_caja(tenant, sucursal, admin)

        compras, entradas = self._crear_compras_demo(
            tenant=tenant,
            proveedores=proveedores,
            productos=productos,
            usuario=admin,
        )
        pedidos, salidas = self._crear_pedidos_demo(
            tenant=tenant,
            sucursal=sucursal,
            clientes=clientes,
            productos=productos,
            usuario=admin,
        )
        pagos, ingreso = self._crear_pagos_demo(
            tenant=tenant,
            pedidos=pedidos,
            usuario=admin,
        )
        movimientos_caja_manuales = self._crear_movimientos_caja_manuales(
            tenant=tenant,
            caja=caja,
            usuario=admin,
        )
        mermas = self._crear_mermas_demo(
            tenant=tenant,
            sucursal=sucursal,
            productos=productos,
            usuario=admin,
        )

        stock_productos = InventarioMovimiento.objects.filter(
            tenant=tenant,
            sucursal=sucursal,
        ).values('producto_id').distinct().count()
        audit_count = AuditLog.objects.filter(tenant=tenant).count()

        self.stdout.write(self.style.SUCCESS('Demo AxisFood creada/actualizada.'))
        self.stdout.write(f'Tenant: {tenant.nombre}')
        self.stdout.write(f'Sucursal: {sucursal.nombre}')
        self.stdout.write('Usuarios:')
        self.stdout.write(f'  admin: axisfood_demo_admin / {DEMO_PASSWORD}')
        self.stdout.write(f'  gerente: axisfood_demo_gerente / {DEMO_PASSWORD}')
        self.stdout.write(f'  operador: axisfood_demo_operador / {DEMO_PASSWORD}')
        self.stdout.write(f'Categorias: {len(categorias)}')
        self.stdout.write(f'Productos: {len(productos)}')
        self.stdout.write(f'Proveedores: {len(proveedores)}')
        self.stdout.write(f'Clientes: {len(clientes)}')
        self.stdout.write(f'Compras demo: {len(compras)} (recibida con {len(entradas)} entradas automaticas)')
        self.stdout.write(f'Pedidos demo: {len(pedidos)} (entregado con {len(salidas)} salidas automaticas)')
        self.stdout.write(
            f'Pagos demo: {len(pagos)} '
            f'({"1 ingreso automatico" if ingreso else "ingreso ya existente"})'
        )
        self.stdout.write(f'Caja abierta: #{caja.id} ({len(movimientos_caja_manuales)} movimientos manuales)')
        self.stdout.write(f'Mermas/perdidas demo: {len(mermas)}')
        self.stdout.write(f'Productos con movimientos de stock: {stock_productos}')
        self.stdout.write(f'Registros de auditoria del tenant demo: {audit_count}')

    def _reset_demo(self):
        tenant = Tenant.objects.filter(nombre=DEMO_TENANT).first()
        demo_users = Usuario.objects.filter(username__in=DEMO_USERNAMES)

        if tenant is None:
            deleted_roles = UserRole.objects.filter(usuario__in=demo_users).delete()[0]
            deleted_users = demo_users.delete()[0]
            self.stdout.write(
                self.style.WARNING(
                    f'No existe tenant demo. Usuarios demo eliminados: {deleted_users}; '
                    f'roles eliminados: {deleted_roles}.'
                )
            )
            return

        with transaction.atomic():
            AuditLog.objects.filter(tenant=tenant).delete()
            AuditLog.objects.filter(usuario__in=demo_users).delete()

            CajaMovimiento.objects.filter(tenant=tenant).delete()
            Pago.objects.filter(tenant=tenant).delete()
            PedidoItem.objects.filter(pedido__tenant=tenant).delete()
            Pedido.objects.filter(tenant=tenant).delete()
            CompraItem.objects.filter(compra__tenant=tenant).delete()
            Compra.objects.filter(tenant=tenant).delete()
            InventarioMovimiento.objects.filter(tenant=tenant).delete()
            CajaSession.objects.filter(tenant=tenant).delete()
            Cliente.objects.filter(tenant=tenant).delete()
            Proveedor.objects.filter(tenant=tenant).delete()
            Producto.objects.filter(tenant=tenant).delete()
            Categoria.objects.filter(tenant=tenant).delete()
            UserRole.objects.filter(usuario__tenant=tenant).delete()
            UserRole.objects.filter(usuario__in=demo_users).delete()
            Usuario.objects.filter(tenant=tenant).delete()
            Usuario.objects.filter(username__in=DEMO_USERNAMES).delete()
            Sucursal.objects.filter(tenant=tenant).delete()
            tenant.delete()

        self.stdout.write(self.style.WARNING('Datos demo anteriores eliminados.'))

    def _crear_tenant_y_sucursal(self):
        tenant, _ = Tenant.objects.update_or_create(
            nombre=DEMO_TENANT,
            defaults={
                'razon_social': 'AxisFood Demo SRL',
                'cuit': '30-70000000-1',
                'email': 'demo@axisfood.local',
                'telefono': '+54 11 4000-0000',
                'direccion': 'Av. Demo 123, Buenos Aires',
                'estado': Tenant.Estado.PRUEBA,
            },
        )
        sucursal, _ = Sucursal.objects.update_or_create(
            tenant=tenant,
            nombre='Sucursal Central',
            defaults={
                'direccion': 'Av. Demo 123',
                'telefono': '+54 11 4000-0001',
                'estado': Sucursal.Estado.ACTIVA,
            },
        )
        return tenant, sucursal

    def _crear_usuarios(self, tenant, sucursal):
        specs = {
            'admin': (DEMO_USERNAMES[0], 'Admin', 'Demo', 'tenant_admin', True),
            'gerente': (DEMO_USERNAMES[1], 'Gerente', 'Demo', 'manager', False),
            'operador': (DEMO_USERNAMES[2], 'Operador', 'Demo', 'operator', False),
        }
        usuarios = {}
        for key, (username, first_name, last_name, rol_codigo, is_staff) in specs.items():
            usuario, _ = Usuario.objects.update_or_create(
                username=username,
                defaults={
                    'email': f'{username}@axisfood.local',
                    'first_name': first_name,
                    'last_name': last_name,
                    'tenant': tenant,
                    'sucursal_principal': sucursal,
                    'estado': Usuario.Estado.ACTIVO,
                    'is_staff': is_staff,
                    'is_superuser': key == 'admin',
                    'is_active': True,
                },
            )
            usuario.set_password(DEMO_PASSWORD)
            usuario.save(update_fields=['password'])
            rol = Rol.objects.get(codigo=rol_codigo)
            UserRole.objects.get_or_create(usuario=usuario, rol=rol)
            usuarios[key] = usuario
        return usuarios

    def _crear_categorias(self, tenant):
        specs = [
            ('Pizzas', 'Pizzas clasicas y especiales'),
            ('Empanadas', 'Empanadas de venta rapida'),
            ('Bebidas', 'Bebidas frias'),
            ('Postres', 'Dulces y postres'),
            ('Insumos', 'Materia prima e ingredientes'),
        ]
        categorias = []
        for nombre, descripcion in specs:
            categoria, _ = Categoria.objects.update_or_create(
                tenant=tenant,
                nombre=nombre,
                defaults={'descripcion': descripcion, 'estado': 'activo'},
            )
            categorias.append(categoria)
        return categorias

    def _crear_productos(self, tenant, categorias):
        by_name = {categoria.nombre: categoria for categoria in categorias}
        specs = [
            ('Pizza Muzzarella', 'Pizzas', '7200.00', '2600.00'),
            ('Pizza Napolitana', 'Pizzas', '7900.00', '2900.00'),
            ('Pizza Fugazzeta', 'Pizzas', '8200.00', '3100.00'),
            ('Pizza Especial', 'Pizzas', '8800.00', '3400.00'),
            ('Empanada Carne', 'Empanadas', '900.00', '330.00'),
            ('Empanada Pollo', 'Empanadas', '900.00', '320.00'),
            ('Empanada Jamon y Queso', 'Empanadas', '950.00', '350.00'),
            ('Empanada Verdura', 'Empanadas', '850.00', '300.00'),
            ('Gaseosa Cola 1.5L', 'Bebidas', '2500.00', '1250.00'),
            ('Agua Mineral 500ml', 'Bebidas', '1200.00', '520.00'),
            ('Cerveza Rubia 473ml', 'Bebidas', '1800.00', '850.00'),
            ('Limonada 500ml', 'Bebidas', '1600.00', '650.00'),
            ('Flan Casero', 'Postres', '2100.00', '780.00'),
            ('Tiramisu', 'Postres', '2800.00', '1100.00'),
            ('Brownie', 'Postres', '2400.00', '900.00'),
            ('Queso Muzzarella kg', 'Insumos', '6800.00', '5200.00'),
            ('Harina 000 kg', 'Insumos', '1400.00', '850.00'),
            ('Salsa Tomate kg', 'Insumos', '1900.00', '950.00'),
            ('Aceitunas kg', 'Insumos', '4200.00', '3000.00'),
            ('Jamon Cocido kg', 'Insumos', '7200.00', '5600.00'),
        ]
        productos = []
        for nombre, categoria_nombre, precio, costo in specs:
            producto, _ = Producto.objects.update_or_create(
                tenant=tenant,
                nombre=nombre,
                defaults={
                    'categoria': by_name[categoria_nombre],
                    'descripcion': f'Producto demo: {nombre}',
                    'precio': Decimal(precio),
                    'costo': Decimal(costo),
                    'stock_minimo': Decimal('5.000'),
                    'stock_maximo': Decimal('120.000'),
                    'punto_reposicion': Decimal('10.000'),
                    'estado': Producto.Estado.ACTIVO,
                },
            )
            productos.append(producto)
        return productos

    def _crear_proveedores(self, tenant):
        specs = [
            ('Distribuidora La Central', '+54 11 4111-1000'),
            ('Lacteos del Plata', '+54 11 4111-2000'),
            ('Bebidas Norte', '+54 11 4111-3000'),
            ('Molino San Pedro', '+54 11 4111-4000'),
            ('Fiambres Palermo', '+54 11 4111-5000'),
        ]
        proveedores = []
        for index, (nombre, telefono) in enumerate(specs, start=1):
            proveedor, _ = Proveedor.objects.update_or_create(
                tenant=tenant,
                nombre=nombre,
                defaults={
                    'telefono': telefono,
                    'email': f'proveedor{index}@axisfood.local',
                    'direccion': f'Calle Proveedor {index}00',
                    'estado': 'activo',
                },
            )
            proveedores.append(proveedor)
        return proveedores

    def _crear_clientes(self, tenant):
        nombres = [
            ('Marina', 'Lopez'),
            ('Carlos', 'Fernandez'),
            ('Sofia', 'Martinez'),
            ('Diego', 'Suarez'),
            ('Lucia', 'Romero'),
            ('Nicolas', 'Paz'),
            ('Valentina', 'Torres'),
            ('Martin', 'Diaz'),
            ('Camila', 'Rivas'),
            ('Andres', 'Molina'),
        ]
        clientes = []
        for index, (nombre, apellido) in enumerate(nombres, start=1):
            cliente, _ = Cliente.objects.update_or_create(
                tenant=tenant,
                email=f'cliente{index}@axisfood.local',
                defaults={
                    'nombre': nombre,
                    'apellido': apellido,
                    'telefono': f'+54 11 5000-{index:04d}',
                    'direccion': f'Calle Cliente {index}00',
                    'notas': 'Cliente demo para presentaciones comerciales.',
                },
            )
            clientes.append(cliente)
        return clientes

    def _obtener_o_crear_caja(self, tenant, sucursal, usuario):
        cajas_abiertas = list(
            CajaSession.objects.filter(
                tenant=tenant,
                sucursal=sucursal,
                usuario=usuario,
                estado=CajaSession.Estado.ABIERTA,
            ).order_by('id')
        )
        if len(cajas_abiertas) > 1:
            raise CommandError(
                'Hay mas de una caja demo abierta para el admin. '
                'Cierre una antes de volver a ejecutar seed_demo.'
            )
        if cajas_abiertas:
            return cajas_abiertas[0]
        caja = CajaSession.objects.create(
            tenant=tenant,
            sucursal=sucursal,
            usuario=usuario,
            saldo_inicial=Decimal('50000.00'),
            estado=CajaSession.Estado.ABIERTA,
        )
        self._audit('apertura_caja', caja, usuario, None, {'saldo_inicial': '50000.00'})
        return caja

    def _crear_compras_demo(self, tenant, proveedores, productos, usuario):
        pendiente = self._crear_compra_simple(
            tenant=tenant,
            proveedor=proveedores[1],
            producto=productos[15],
            usuario=usuario,
            estado=Compra.Estado.PENDIENTE,
            cantidad=Decimal('8.000'),
        )
        aprobada = self._crear_compra_simple(
            tenant=tenant,
            proveedor=proveedores[3],
            producto=productos[16],
            usuario=usuario,
            estado=Compra.Estado.APROBADA,
            cantidad=Decimal('18.000'),
        )
        recibida, entradas = self._crear_compra_recibida(
            tenant=tenant,
            proveedor=proveedores[0],
            productos=productos,
            usuario=usuario,
        )
        return [pendiente, aprobada, recibida], entradas

    def _crear_compra_simple(self, tenant, proveedor, producto, usuario, estado, cantidad):
        compra = Compra.objects.filter(
            tenant=tenant,
            proveedor=proveedor,
            estado=estado,
            items__producto=producto,
        ).distinct().first()

        subtotal = cantidad * producto.costo
        if compra is None:
            compra = Compra.objects.create(
                tenant=tenant,
                proveedor=proveedor,
                usuario=usuario,
                estado=estado,
                total=subtotal,
            )
            self._audit('creacion', compra, usuario, None, CompraSerializer(compra).data)
        else:
            compra.usuario = usuario
            compra.total = subtotal
            compra.save(update_fields=['usuario', 'total'])

        CompraItem.objects.filter(compra=compra).exclude(producto=producto).delete()
        CompraItem.objects.update_or_create(
            compra=compra,
            producto=producto,
            defaults={
                'cantidad': cantidad,
                'costo_unitario': producto.costo,
                'subtotal': subtotal,
            },
        )
        return compra

    def _crear_pedidos_demo(self, tenant, sucursal, clientes, productos, usuario):
        specs = [
            (clientes[1], Pedido.Estado.PENDIENTE, productos[8:10], [Decimal('2.000'), Decimal('2.000')]),
            (clientes[2], Pedido.Estado.EN_PREPARACION, productos[0:2], [Decimal('1.000'), Decimal('1.000')]),
            (clientes[3], Pedido.Estado.LISTO, productos[4:7], [Decimal('6.000'), Decimal('6.000'), Decimal('6.000')]),
            (clientes[4], Pedido.Estado.EN_CAMINO, productos[10:12], [Decimal('3.000'), Decimal('2.000')]),
        ]
        pedidos = [
            self._crear_pedido_simple(
                tenant=tenant,
                sucursal=sucursal,
                cliente=cliente,
                productos=pedido_productos,
                cantidades=cantidades,
                estado=estado,
                usuario=usuario,
            )
            for cliente, estado, pedido_productos, cantidades in specs
        ]
        entregado, salidas = self._crear_pedido_entregado(
            tenant=tenant,
            sucursal=sucursal,
            cliente=clientes[0],
            productos=productos[:5],
            usuario=usuario,
        )
        pedidos.append(entregado)
        return pedidos, salidas

    def _crear_pedido_simple(self, tenant, sucursal, cliente, productos, cantidades, estado, usuario):
        pedido = Pedido.objects.filter(
            tenant=tenant,
            sucursal=sucursal,
            cliente=cliente,
            estado=estado,
            items__producto=productos[0],
        ).distinct().first()
        if pedido is None:
            pedido = Pedido.objects.create(
                tenant=tenant,
                sucursal=sucursal,
                cliente=cliente,
                canal=Pedido.Canal.MOSTRADOR,
                estado=estado,
                subtotal=Decimal('0.00'),
                descuento=Decimal('0.00'),
                total=Decimal('0.00'),
                created_by=usuario,
            )
            self._audit('creacion', pedido, usuario, None, PedidoSerializer(pedido).data)
        else:
            pedido.sucursal = sucursal
            pedido.estado = estado
            pedido.created_by = usuario
            pedido.save(update_fields=['sucursal', 'estado', 'created_by'])

        PedidoItem.objects.filter(pedido=pedido).exclude(producto__in=productos).delete()
        total = Decimal('0.00')
        for producto, cantidad in zip(productos, cantidades):
            subtotal = cantidad * producto.precio
            PedidoItem.objects.update_or_create(
                pedido=pedido,
                producto=producto,
                defaults={
                    'cantidad': cantidad,
                    'precio_unitario': producto.precio,
                    'subtotal': subtotal,
                },
            )
            total += subtotal
        pedido.subtotal = total
        pedido.total = total
        pedido.save(update_fields=['subtotal', 'total'])
        return pedido

    def _crear_pagos_demo(self, tenant, pedidos, usuario):
        pago_aprobado, ingreso = self._crear_pago_aprobado(
            tenant=tenant,
            pedido=pedidos[-1],
            usuario=usuario,
        )
        pago_pendiente = Pago.objects.filter(
            tenant=tenant,
            pedido=pedidos[0],
            estado=Pago.Estado.PENDIENTE,
        ).first()
        if pago_pendiente is None:
            pago_pendiente = Pago.objects.create(
                tenant=tenant,
                pedido=pedidos[0],
                monto=pedidos[0].total,
                metodo_pago=Pago.MetodoPago.TRANSFERENCIA,
                estado=Pago.Estado.PENDIENTE,
            )
            self._audit('creacion', pago_pendiente, usuario, None, PagoSerializer(pago_pendiente).data)
        else:
            pago_pendiente.monto = pedidos[0].total
            pago_pendiente.save(update_fields=['monto'])
        return [pago_aprobado, pago_pendiente], ingreso

    def _crear_movimientos_caja_manuales(self, tenant, caja, usuario):
        specs = [
            (
                CajaMovimiento.Tipo.INGRESO,
                Decimal('18000.00'),
                'Ingreso manual demo - fondo adicional',
            ),
            (
                CajaMovimiento.Tipo.EGRESO,
                Decimal('7500.00'),
                'Egreso manual demo - compra menor',
            ),
        ]
        movimientos = []
        for tipo, monto, descripcion in specs:
            movimiento, created = CajaMovimiento.objects.update_or_create(
                tenant=tenant,
                caja_session=caja,
                descripcion=descripcion,
                defaults={
                    'tipo': tipo,
                    'monto': monto,
                    'usuario': usuario,
                },
            )
            movimientos.append(movimiento)
            if created:
                self._audit(
                    'creacion_movimiento_caja',
                    movimiento,
                    usuario,
                    None,
                    CajaMovimientoSerializer(movimiento).data,
                )
        return movimientos

    def _crear_mermas_demo(self, tenant, sucursal, productos, usuario):
        specs = [
            (
                InventarioMovimiento.TipoMovimiento.MERMA,
                productos[1],
                Decimal('1.000'),
                'Merma demo - rotura en preparacion',
                1,
            ),
            (
                InventarioMovimiento.TipoMovimiento.MERMA,
                productos[5],
                Decimal('3.000'),
                'Merma demo - error de porcionado',
                2,
            ),
            (
                InventarioMovimiento.TipoMovimiento.DESPERDICIO,
                productos[12],
                Decimal('2.000'),
                'Desperdicio demo - sobrante de cocina',
                3,
            ),
            (
                InventarioMovimiento.TipoMovimiento.VENCIMIENTO,
                productos[9],
                Decimal('4.000'),
                'Vencimiento demo - producto fuera de fecha',
                4,
            ),
        ]
        movimientos = []
        now = timezone.now()
        for tipo, producto, cantidad, motivo, days_ago in specs:
            movimiento, created = InventarioMovimiento.objects.update_or_create(
                tenant=tenant,
                sucursal=sucursal,
                producto=producto,
                motivo=motivo,
                defaults={
                    'tipo_movimiento': tipo,
                    'cantidad': cantidad,
                    'costo_unitario': producto.costo,
                    'costo_total': cantidad * producto.costo,
                    'usuario': usuario,
                    'fecha': now - timedelta(days=days_ago),
                },
            )
            movimientos.append(movimiento)
            if created:
                self._audit(
                    'creacion',
                    movimiento,
                    usuario,
                    None,
                    InventarioMovimientoSerializer(movimiento).data,
                )
        return movimientos

    def _crear_compra_recibida(self, tenant, proveedor, productos, usuario):
        compra = Compra.objects.filter(
            tenant=tenant,
            proveedor=proveedor,
            estado=Compra.Estado.RECIBIDA,
            items__producto=productos[0],
        ).distinct().first()
        if compra and self._compra_tiene_entradas(compra):
            entradas_existentes = list(
                InventarioMovimiento.objects.filter(
                    tenant=tenant,
                    motivo__startswith='Entrada',
                    motivo__contains=f'#{compra.id}',
                )
            )
            if len(entradas_existentes) == len(productos):
                return compra, entradas_existentes
            raise CommandError(
                'La compra recibida demo ya existe con una cantidad de entradas antigua. '
                'Ejecuta seed_demo --reset para regenerar la demo profesional.'
            )

        with transaction.atomic():
            compra = Compra.objects.create(
                tenant=tenant,
                proveedor=proveedor,
                usuario=usuario,
                estado=Compra.Estado.APROBADA,
                total=Decimal('1.00'),
            )
            total = Decimal('0.00')
            for producto in productos:
                cantidad = Decimal('36.000')
                subtotal = cantidad * producto.costo
                CompraItem.objects.create(
                    compra=compra,
                    producto=producto,
                    cantidad=cantidad,
                    costo_unitario=producto.costo,
                    subtotal=subtotal,
                )
                total += subtotal
            compra.total = total
            compra.save(update_fields=['total'])

        previous = CompraSerializer(compra).data
        serializer = self._serializer(
            CompraSerializer,
            compra,
            {'estado': Compra.Estado.RECIBIDA},
            usuario,
            partial=True,
        )
        compra, movimientos = actualizar_compra_con_stock(serializer, usuario)
        self._audit('modificacion', compra, usuario, previous, CompraSerializer(compra).data)
        for movimiento in movimientos:
            self._audit(
                'creacion',
                movimiento,
                usuario,
                None,
                InventarioMovimientoSerializer(movimiento).data,
            )
        return compra, movimientos

    def _crear_pedido_entregado(self, tenant, sucursal, cliente, productos, usuario):
        pedido = Pedido.objects.filter(
            tenant=tenant,
            cliente=cliente,
            estado=Pedido.Estado.ENTREGADO,
            items__producto=productos[0],
        ).distinct().first()
        if pedido and self._pedido_tiene_salidas(pedido):
            return pedido, list(
                InventarioMovimiento.objects.filter(
                    tenant=tenant,
                    motivo__startswith='Salida',
                    motivo__contains=f'#{pedido.id}',
                )
            )

        with transaction.atomic():
            pedido = Pedido.objects.create(
                tenant=tenant,
                sucursal=sucursal,
                cliente=cliente,
                canal=Pedido.Canal.MOSTRADOR,
                estado=Pedido.Estado.PENDIENTE,
                subtotal=Decimal('0.00'),
                descuento=Decimal('0.00'),
                total=Decimal('0.00'),
                created_by=usuario,
            )
            total = Decimal('0.00')
            cantidades = [Decimal('2.000'), Decimal('1.000'), Decimal('1.000'), Decimal('6.000'), Decimal('4.000')]
            for producto, cantidad in zip(productos, cantidades):
                subtotal = cantidad * producto.precio
                PedidoItem.objects.create(
                    pedido=pedido,
                    producto=producto,
                    cantidad=cantidad,
                    precio_unitario=producto.precio,
                    subtotal=subtotal,
                )
                total += subtotal
            pedido.subtotal = total
            pedido.total = total
            pedido.save(update_fields=['subtotal', 'total'])

        for estado in (
            Pedido.Estado.EN_PREPARACION,
            Pedido.Estado.LISTO,
            Pedido.Estado.EN_CAMINO,
        ):
            pedido.estado = estado
            pedido.save(update_fields=['estado'])

        previous = PedidoSerializer(pedido).data
        serializer = self._serializer(
            PedidoSerializer,
            pedido,
            {'estado': Pedido.Estado.ENTREGADO},
            usuario,
            partial=True,
        )
        pedido, movimientos = actualizar_pedido_con_stock(serializer, usuario)
        self._audit('modificacion', pedido, usuario, previous, PedidoSerializer(pedido).data)
        for movimiento in movimientos:
            self._audit(
                'creacion',
                movimiento,
                usuario,
                None,
                InventarioMovimientoSerializer(movimiento).data,
            )
        return pedido, movimientos

    def _crear_pago_aprobado(self, tenant, pedido, usuario):
        pago = Pago.objects.filter(
            tenant=tenant,
            pedido=pedido,
            estado=Pago.Estado.APROBADO,
        ).first()
        if pago:
            ingreso = self._ingreso_pago(pago)
            return pago, ingreso

        pago = Pago.objects.create(
            tenant=tenant,
            pedido=pedido,
            monto=pedido.total,
            metodo_pago=Pago.MetodoPago.EFECTIVO,
            estado=Pago.Estado.PENDIENTE,
        )
        previous = PagoSerializer(pago).data
        serializer = self._serializer(
            PagoSerializer,
            pago,
            {'estado': Pago.Estado.APROBADO},
            usuario,
            partial=True,
        )
        pago, ingreso = actualizar_pago_con_caja(serializer, usuario)
        self._audit('modificacion', pago, usuario, previous, PagoSerializer(pago).data)
        if ingreso is not None:
            self._audit(
                'creacion_movimiento_caja',
                ingreso,
                usuario,
                None,
                CajaMovimientoSerializer(ingreso).data,
            )
        return pago, ingreso

    def _serializer(self, serializer_class, instance, data, usuario, partial=False):
        request = SimpleNamespace(user=usuario)
        serializer = serializer_class(
            instance,
            data=data,
            partial=partial,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        return serializer

    def _audit(self, accion, instance, usuario, datos_anteriores, datos_nuevos):
        tenant = getattr(instance, 'tenant', None)
        AuditLog.objects.create(
            tenant=tenant,
            usuario=usuario,
            accion=accion,
            recurso=instance.__class__.__name__,
            recurso_id=str(instance.pk),
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            ip='127.0.0.1',
            user_agent='seed_demo',
        )

    def _compra_tiene_entradas(self, compra):
        return InventarioMovimiento.objects.filter(
            tenant=compra.tenant,
            tipo_movimiento=InventarioMovimiento.TipoMovimiento.ENTRADA,
            motivo__startswith='Entrada',
            motivo__contains=f'#{compra.id}',
        ).exists()

    def _pedido_tiene_salidas(self, pedido):
        return InventarioMovimiento.objects.filter(
            tenant=pedido.tenant,
            tipo_movimiento=InventarioMovimiento.TipoMovimiento.SALIDA,
            motivo__startswith='Salida',
            motivo__contains=f'#{pedido.id}',
        ).exists()

    def _ingreso_pago(self, pago):
        return pago.tenant.caja_movimientos.filter(
            descripcion__startswith='Ingreso',
            descripcion__contains=f'#{pago.id}',
        ).first()
