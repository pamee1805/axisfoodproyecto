PROJECT_CONTEXT = """
# PROJECT_CONTEXT.md

# Contexto del Proyecto

## 1. Nombre del proyecto

**Nombre:** GastroChef

**Descripción breve:**
GastroChef es una plataforma de gestión gastronómica para pequeños y medianos negocios de comida.
Centraliza pedidos, pagos, deliverys, caja, productos, proveedores, devoluciones, desperdicios,
mermas, estadísticas y suscripciones. Su objetivo principal es ayudar al negocio a controlar su
operación diaria y detectar cuánto dinero pierde, por qué lo pierde y cómo mejorar su rentabilidad.

---

## 2. Problema que resuelve

Muchos negocios gastronómicos conocen cuánto venden, pero no saben con precisión cuánto pierden.
Las pérdidas pueden aparecer por productos vencidos, comida preparada que no se vendió, devoluciones
de clientes, errores de cocina, errores de entrega, diferencias de caja o efectivo mal rendido
por deliverys.

### Situación actual

- Los pedidos, pagos, stock y deliverys suelen gestionarse con WhatsApp, planillas, papel o sistemas separados.
- Los desperdicios, devoluciones y mermas muchas veces no se registran en el momento.
- En cocina no hay tiempo para completar formularios largos, por eso muchos desperdicios terminan registrándose tarde o de forma incorrecta.
- El efectivo manejado por deliverys puede generar diferencias difíciles de controlar.
- Los productos preparados que no se venden o superan su vida útil generan pérdidas que no siempre se miden.
- El dueño o responsable conoce las ventas, pero no siempre conoce las pérdidas reales ni sus causas.

### Dolor principal

> El negocio sabe cuánto vende, pero no sabe con precisión cuánto dinero pierde, por qué lo pierde
> ni en qué parte de la operación se generan esas pérdidas.

---

## 3. Objetivo del sistema

El sistema debe permitir:

- Gestionar pedidos, productos, clientes, caja, pagos, deliverys y proveedores desde una única plataforma.
- Controlar rendiciones de efectivo de los deliverys, registrando cuánto deben entregar, cuánto entregaron y si existen diferencias.
- Registrar rápidamente desperdicios, devoluciones, mermas, productos vencidos, productos no vendidos y errores operativos.
- Realizar devoluciones parciales de tickets, anulando solo los productos seleccionados y registrando el reintegro correspondiente.
- Generar estadísticas de ventas, pérdidas, rentabilidad, productos problemáticos, desperdicios y devoluciones.
- Enviar notificaciones automáticas a clientes sobre el estado de sus pedidos.
- Gestionar usuarios por rol, área, estado y permisos.
- Gestionar suscripciones de los negocios que usen la plataforma, incluyendo avisos de vencimiento, suspensión y reactivación de cuentas.

---

## 4. Usuarios principales

| Usuario / Actor     | Descripción                                        | Necesidad principal                                                                |
|---------------------|----------------------------------------------------|------------------------------------------------------------------------------------|
| Super Administrador | Responsable general de la plataforma GastroChef    | Gestionar negocios, suscripciones, vencimientos, suspensiones y reactivaciones     |
| Jefe                | Máxima autoridad dentro del negocio gastronómico   | Controlar operación, caja, usuarios, deliverys, productos, pérdidas y rentabilidad |
| Encargado           | Responsable de la operación diaria del local       | Supervisar pedidos, personal, caja, cocina, deliverys, incidencias y rendiciones   |
| Personal            | Empleado del negocio asignado a un área específica | Realizar tareas operativas según su área y permisos                                |
| Delivery            | Repartidor del negocio                             | Ver pedidos asignados, entregarlos y rendir efectivo cobrado                       |
| Cliente             | Persona que realiza el pedido                      | Consultar estado del pedido y recibir notificaciones automáticas                   |

### Áreas internas posibles

- Administración
- Caja
- Cocina
- Atención
- Producción

### Estados de usuario posibles

- Activo
- Inactivo
- Suspendido
- Vacaciones

---

## 5. Alcance inicial

### Incluido en el MVP

- Gestión de pedidos y estados.
- Gestión de productos, combos y promociones.
- Gestión de clientes.
- Gestión de deliverys y asignación de pedidos.
- Control de pagos por efectivo, Mercado Pago, tarjeta y transferencia.
- Control de caja e ingresos.
- Sistema de rendición de efectivo para deliverys.
- Cierre de rendición y control de diferencias.
- Panel de cocina.
- Registro rápido de desperdicios, devoluciones, mermas y productos vencidos.
- Registro de producción excedente o comida preparada que no se vendió.
- Devoluciones parciales de tickets y registro de reintegros según método de pago.
- Gestión de proveedores y compras.
- Estadísticas básicas de ventas, pérdidas, desperdicios, devoluciones y rentabilidad.
- Notificaciones automáticas al cliente.
- Gestión de usuarios, roles, áreas y estados.
- Gestión de suscripciones, avisos de vencimiento, suspensión y reactivación de cuentas.

### Fuera de alcance inicial

- Integración fiscal con AFIP y facturación electrónica automática.
- Geolocalización en tiempo real de deliverys.
- Aplicación móvil nativa.
- Inteligencia artificial para predicción de ventas.
- Integración bancaria automática.
- Integración avanzada con Mercado Pago.
- Sistema de fidelización por puntos.
- Automatización completa de compras a proveedores.

---

## 6. Reglas del negocio

| Regla                                                           | Descripción                                                                                                           | Impacto técnico                                        |
|-----------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| Un pedido debe tener un estado válido                           | Todo pedido debe estar en: pendiente, en preparación, en camino, entregado, finalizado o cancelado                    | Modelo Pedido, validaciones de estado                  |
| Solo usuarios autorizados pueden asignar deliverys              | La asignación la realizan jefe, encargado o usuario con permiso específico                                            | Permisos, endpoint de asignación                       |
| Solo pagos en efectivo generan rendición                        | Mercado Pago, tarjeta y transferencia ingresan directamente al negocio, no generan deuda del delivery                 | Lógica de pagos y rendiciones                          |
| El sistema calcula efectivo pendiente                           | Cada pedido en efectivo entregado por un delivery suma al total que debe rendir                                        | Modelo Rendición, cálculo automático                   |
| Solo usuarios autorizados cierran rendiciones                   | El cierre confirma que el dinero fue recibido por el negocio                                                          | Permisos, historial de movimientos                     |
| Se deben registrar diferencias de rendición                     | Si el monto entregado no coincide con el esperado, se registra la diferencia                                          | Validación, campo diferencia en modelo Rendición       |
| Las devoluciones parciales afectan solo productos seleccionados | Si un cliente devuelve un producto, no se anula todo el ticket                                                        | Modelo Venta, DetalleVenta, Devolución                 |
| Los reintegros dependen del método de pago                      | En efectivo: salida de caja; en Mercado Pago: reintegro digital o pendiente                                           | Modelo Pago, Reintegro                                 |
| Toda merma debe tener motivo                                    | Cada desperdicio debe registrar causa para permitir análisis posterior                                                | Modelo Merma, validaciones                             |
| Cocina debe registrar incidencias rápido                        | El registro se realiza con pocos clics: imagen pequeña, cantidad y motivo                                             | Interfaz simple, modelo Incidencia                     |
| Los cambios de estado generan notificaciones                    | El cliente recibe avisos automáticos cuando cambia el estado de su pedido                                             | Servicio de notificaciones                             |
| Las cuentas suspendidas no pueden operar                        | Si el negocio no paga la suscripción, se bloquea el acceso al sistema                                                | Autenticación, permisos                                |
| Se debe avisar antes del vencimiento                            | El sistema notifica 5 días antes de vencer la suscripción                                                             | Notificaciones, tarea programada                       |
| Los movimientos importantes deben quedar auditados              | Cambios de estado, devoluciones, cierres de caja y rendiciones guardan usuario, fecha y hora                          | Historial, auditoría                                   |
| Un usuario debe tener rol y estado                              | Todo usuario debe tener un rol definido y un estado de cuenta                                                         | Modelo Usuario                                         |
| El área no reemplaza al rol                                     | Un usuario puede ser personal y pertenecer al área de cocina, caja, atención o producción                             | Modelo Usuario, Área                                   |
| Los permisos especiales deben validarse                         | Algunas acciones sensibles pueden depender de permisos específicos además del rol                                     | Modelo Permiso                                         |

---

## 7. Glosario del dominio

| Término              | Definición                                                                       |
|----------------------|----------------------------------------------------------------------------------|
| Pedido               | Solicitud de compra realizada por un cliente                                     |
| Estado de pedido     | Situación actual del pedido dentro del proceso                                   |
| Cliente              | Persona que realiza una compra                                                   |
| Producto             | Comida, bebida o artículo vendido por el negocio                                 |
| Combo                | Conjunto de productos vendidos juntos como promoción                             |
| Delivery             | Repartidor encargado de entregar pedidos                                         |
| Rendición            | Proceso donde el delivery entrega al negocio el efectivo cobrado                 |
| Cierre de rendición  | Confirmación administrativa de que el dinero fue recibido                        |
| Diferencia           | Descuadre entre el dinero esperado y el dinero entregado                         |
| Caja                 | Registro de ingresos y egresos del negocio                                       |
| Pago digital         | Pago realizado por Mercado Pago, tarjeta, transferencia u otro medio electrónico |
| Devolución parcial   | Anulación de uno o más productos sin cancelar todo el ticket                     |
| Reintegro            | Devolución de dinero al cliente                                                  |
| Merma                | Producto desperdiciado, vencido, dañado o no vendido                             |
| Desperdicio          | Producto perdido durante la operación diaria                                     |
| Incidencia           | Evento que genera una pérdida o afecta la calidad del servicio                   |
| Producción excedente | Comida preparada que no llegó a venderse                                         |
| Producto vencido     | Producto que superó su vida útil                                                 |
| Proveedor            | Persona o empresa que abastece productos o insumos                               |
| Stock                | Cantidad disponible de productos o insumos                                       |
| Rentabilidad         | Relación entre ingresos, costos y pérdidas del negocio                           |
| Suscripción          | Pago mensual para utilizar GastroChef                                            |
| Cuenta suspendida    | Cuenta bloqueada temporalmente por falta de pago                                 |
| Notificación         | Aviso enviado al usuario dentro de la aplicación                                 |
| Rol                  | Nivel de responsabilidad del usuario dentro del sistema                          |
| Área                 | Sector operativo donde trabaja un usuario                                        |
| Permiso especial     | Autorización adicional para ejecutar una acción sensible                         |

---

## 8. Métricas de éxito

El proyecto será considerado exitoso si:

- Permite gestionar pedidos desde su creación hasta su finalización.
- Permite asignar pedidos a deliverys y controlar sus entregas.
- Calcula correctamente el efectivo pendiente de cada repartidor.
- Permite cerrar rendiciones y registrar diferencias.
- Registra pagos, ingresos y movimientos de caja.
- Permite realizar devoluciones parciales sin anular tickets completos.
- Permite registrar desperdicios, devoluciones y mermas en pocos segundos.
- Identifica productos con mayores devoluciones, desperdicios o pérdidas.
- Genera estadísticas básicas de ventas, pérdidas y rentabilidad.
- Reduce la dependencia de registros manuales en papel o planillas.
- Envía notificaciones automáticas al cliente.
- Permite administrar usuarios por rol, área, estado y permisos.
- Permite administrar suscripciones, vencimientos y suspensión de cuentas.

---

## 9. Restricciones conocidas

- **Técnica:** El sistema se desarrollará con Python y Django como backend, y PostgreSQL como base de datos inicial.
- **Técnica:** El sistema debe priorizar una interfaz simple para cocina y caja, ya que son áreas de alta demanda operativa.
- **Organizacional:** El proyecto se realiza en un contexto académico con equipo y tiempo limitados.
- **Presupuestaria:** La primera versión estará orientada a pequeños y medianos negocios gastronómicos.
- **De alcance:** Algunas integraciones externas quedan fuera del alcance inicial (AFIP, Mercado Pago avanzado, geolocalización).
- **De tiempo:** El equipo tiene tiempo limitado para desarrollar el MVP; las mejoras futuras quedan documentadas como fuera de alcance.

---

## 10. Criterios de aceptación del MVP

- El sistema permite iniciar sesión según rol de usuario y diferencia roles, áreas y estados.
- El administrador puede crear, editar y cancelar pedidos, y cambiar su estado.
- El cliente recibe notificaciones automáticas sobre el estado del pedido.
- Cocina puede visualizar pedidos nuevos y en preparación.
- Cocina puede registrar desperdicios, devoluciones o mermas en pocos segundos (producto, cantidad y motivo).
- El administrador puede asignar pedidos a deliverys.
- El delivery puede visualizar sus pedidos asignados.
- El sistema calcula el efectivo pendiente de rendición por delivery.
- El administrador o usuario autorizado puede cerrar una rendición y el sistema registra diferencias entre monto esperado y entregado.
- El sistema permite registrar productos, combos y promociones.
- El sistema permite registrar pagos por distintos medios.
- El sistema permite realizar devoluciones parciales de productos y registra reintegros según método de pago.
- El sistema permite registrar proveedores y compras.
- El sistema muestra estadísticas básicas de ventas, devoluciones, desperdicios y pérdidas.
- El sistema permite gestionar suscripciones, notifica con 5 días de anticipación al vencimiento, y permite suspender y reactivar cuentas.
- Los usuarios acceden únicamente a las funciones permitidas por su rol, área o permisos especiales.
- Toda la información crítica queda centralizada en una única plataforma.
"""