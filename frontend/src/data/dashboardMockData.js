// Mock temporal para gráficos del Dashboard 2.0.
// Usar solo mientras no existan endpoints históricos/rankings reales en el backend.
// No representa datos reales de la empresa.

export const salesSevenDaysMockData = [
  { label: 'Lun', ventas: 124000 },
  { label: 'Mar', ventas: 156000 },
  { label: 'Mié', ventas: 141000 },
  { label: 'Jue', ventas: 188000 },
  { label: 'Vie', ventas: 232000 },
  { label: 'Sáb', ventas: 274000 },
  { label: 'Dom', ventas: 219000 },
]

export const commerceComparisonMockData = [
  { label: 'Lun', ventas: 124000, compras: 72000 },
  { label: 'Mar', ventas: 156000, compras: 68000 },
  { label: 'Mié', ventas: 141000, compras: 83000 },
  { label: 'Jue', ventas: 188000, compras: 91000 },
  { label: 'Vie', ventas: 232000, compras: 118000 },
  { label: 'Sáb', ventas: 274000, compras: 126000 },
  { label: 'Dom', ventas: 219000, compras: 76000 },
]

export const orderStatusMockData = [
  { name: 'Pendientes', value: 8, color: '#ffd08a' },
  { name: 'En preparación', value: 12, color: '#8edcff' },
  { name: 'Finalizados', value: 32, color: '#69e6bd' },
  { name: 'Cancelados', value: 3, color: '#ffb6c0' },
]

export const inventoryMovementMockData = [
  { label: 'Entrada', cantidad: 28, tipo: 'entrada' },
  { label: 'Salida', cantidad: 18, tipo: 'salida' },
  { label: 'Ajuste', cantidad: 6, tipo: 'ajuste' },
  { label: 'Merma', cantidad: 4, tipo: 'merma' },
  { label: 'Entrada', cantidad: 34, tipo: 'entrada' },
  { label: 'Salida', cantidad: 22, tipo: 'salida' },
]

