export const cashHelp = {
  abrir: {
    label: 'Abrir caja',
    description: 'Iniciá el turno de caja. Desde este momento se registran movimientos.',
  },
  cerrar: {
    label: 'Cerrar caja',
    description: 'Finaliza el turno. Revisá el efectivo contado antes de confirmar.',
  },
  ingreso: {
    label: 'Ingreso',
    description: 'Usalo cuando entra dinero manualmente a caja.',
  },
  egreso: {
    label: 'Egreso',
    description: 'Usalo cuando sale dinero manualmente de caja.',
  },
}

export const mermaTypeHelp = {
  merma: {
    label: 'Producto descartado o perdido',
    description: 'Pérdida general de producto que ya no puede venderse.',
  },
  desperdicio: {
    label: 'Desperdicio',
    description: 'Producto perdido por preparación, cocina o manipulación.',
  },
  vencimiento: {
    label: 'Vencimiento',
    description: 'Producto que ya no puede venderse por fecha vencida.',
  },
}

export const inventoryMovementHelp = {
  entrada: {
    label: 'Entrada',
    description: 'Agrega stock al producto.',
  },
  salida: {
    label: 'Salida',
    description: 'Reduce stock por uso o retiro.',
  },
  ajuste: {
    label: 'Ajuste',
    description: 'Corrige diferencias de conteo. Puede ser positivo o negativo.',
  },
  merma: {
    label: 'Producto descartado o perdido',
    description: 'Registra una pérdida general de producto y reduce stock.',
  },
  desperdicio: {
    label: 'Desperdicio',
    description: 'Registra producto perdido por preparación, cocina o manipulación.',
  },
  vencimiento: {
    label: 'Vencimiento',
    description: 'Registra producto que ya no puede venderse por fecha vencida.',
  },
  devolucion: {
    label: 'Devolución',
    description: 'Registra producto devuelto que vuelve al stock.',
  },
}

export const salesHelp = {
  crearPedido: {
    label: 'Crear pedido',
    description: 'Al marcarlo como entregado o finalizado descuenta stock automáticamente.',
  },
  registrarPago: {
    label: 'Registrar pago',
    description: 'Al aprobarlo registra el ingreso en la caja abierta.',
  },
  cancelarPedido: {
    label: 'Cancelar pedido',
    description: 'Esta acción cambia el estado del pedido a cancelado.',
  },
}

export const purchaseHelp = {
  crearOrden: {
    label: 'Crear orden',
    description: 'Registra una compra pendiente con sus productos.',
  },
  marcarRecibida: {
    label: 'Marcar como recibida',
    description: 'Al recibir una compra genera entradas automáticas de inventario.',
  },
}

export const rolePresentation = {
  system_admin: {
    label: 'Administrador general',
    description: 'Acceso completo para configurar AxisFood y administrar todas las empresas.',
  },
  tenant_admin: {
    label: 'Administrador de empresa',
    description: 'Gestiona usuarios, roles, permisos y operación completa de su empresa.',
  },
  manager: {
    label: 'Encargado',
    description: 'Supervisa la operación diaria, productos, inventario y reportes del negocio.',
  },
  operator: {
    label: 'Operador',
    description: 'Registra ventas, movimientos y tareas operativas sin administrar accesos.',
  },
  viewer: {
    label: 'Solo consulta',
    description: 'Puede revisar información y reportes, sin crear, editar ni eliminar datos.',
  },
}



