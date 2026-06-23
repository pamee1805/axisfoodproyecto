# AUDIT.md

# Auditoría y Trazabilidad

## 1. Objetivo

Garantizar la trazabilidad completa de todas las acciones críticas realizadas dentro de AxisFood.

La auditoría permite:

- identificar quién realizó una acción;
- cuándo fue realizada;
- sobre qué recurso;
- desde qué tenant;
- desde qué dirección IP;
- qué información fue modificada.

Toda acción crítica debe ser auditable.

---

## 2. Principios

### Trazabilidad Obligatoria

Toda operación sensible debe quedar registrada.

### Inmutabilidad

Los registros de auditoría no pueden modificarse manualmente.

### Multi-Tenant

Toda auditoría debe pertenecer a un tenant.

### Seguridad

La auditoría debe sobrevivir a errores operativos.

---

## 3. Modelo AuditLog

### Campos

```txt
id
tenant_id
usuario_id
accion
recurso
recurso_id
datos_anteriores
datos_nuevos
ip
user_agent
fecha
```

---

## 4. Eventos Auditables

### Usuarios

- Login.
- Logout.
- Creación.
- Modificación.
- Suspensión.
- Reactivación.
- Cambio de rol.
- Cambio de permisos.

---

### Productos

- Creación.
- Modificación.
- Eliminación lógica.
- Cambio de precio.
- Cambio de costo.

---

### Inventario

- Entrada.
- Salida.
- Ajuste.
- Corrección.
- Reposición.

---

### Pedidos

- Creación.
- Modificación.
- Cambio de estado.
- Cancelación.
- Finalización.

---

### Pagos

- Registro.
- Aprobación.
- Rechazo.
- Reintegro.

---

### Caja

- Apertura.
- Cierre.
- Ajustes.
- Diferencias.

---

### Compras

- Creación.
- Aprobación.
- Recepción.
- Cancelación.

---

### Proveedores

- Creación.
- Modificación.
- Baja lógica.

---

### Deliverys

- Asignación.
- Cambio de estado.
- Rendiciones.

---

### Rendiciones

- Apertura.
- Revisión.
- Observación.
- Cierre.

---

### Mermas

- Registro.
- Modificación.
- Corrección.

---

### Desperdicios

- Registro.
- Modificación.

---

### Vencimientos

- Registro.
- Corrección.

---

### Devoluciones

- Creación.
- Aprobación.
- Rechazo.

---

### Reportes

- Visualización.
- Exportación PDF.
- Exportación Excel.
- Exportación CSV.

---

## 5. Niveles de Severidad

| Nivel | Descripción |
|---|---|
| INFO | Operaciones normales |
| WARNING | Operaciones sensibles |
| ERROR | Fallos relevantes |
| CRITICAL | Eventos críticos de seguridad |

---

## 6. Eventos Críticos

Se registran como CRITICAL:

- Acceso denegado.
- Cambio de permisos.
- Cambio de roles.
- Exportación masiva.
- Suspensión de usuarios.
- Suspensión de tenants.
- Eliminación de información sensible.

---

## 7. Información Mínima Obligatoria

Toda auditoría debe registrar:

- Usuario.
- Tenant.
- Acción.
- Recurso.
- Fecha.
- Hora.
- Dirección IP.
- Resultado.

---

## 8. Reglas de Implementación

- La auditoría se ejecuta desde backend.
- El frontend no puede generar auditoría.
- Toda acción sensible genera auditoría automática.
- Toda exportación genera auditoría.
- Todo cambio de estado genera auditoría.
- Todo cambio financiero genera auditoría.
- Todo cambio de inventario genera auditoría.

---

## 9. Retención

Los registros de auditoría deben conservarse por un mínimo de:

```txt
24 meses
```

o según requisitos legales aplicables.

---

## 10. Consultas Permitidas

Los usuarios pueden consultar auditoría únicamente según sus permisos.

### system_admin

Acceso global.

### tenant_admin

Acceso al tenant.

### manager

Acceso parcial autorizado.

### otros roles

Sin acceso directo.

---

## 11. Reportes de Auditoría

Debe ser posible generar:

- Auditoría de usuarios.
- Auditoría de inventario.
- Auditoría de caja.
- Auditoría de compras.
- Auditoría de pedidos.
- Auditoría de rendiciones.
- Auditoría de exportaciones.

---

## 12. Regla de Oro

> Si una acción afecta dinero, inventario, permisos, estados o información sensible, debe quedar registrada en la auditoría.