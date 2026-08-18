import { Schema, model } from 'mongoose';

// Definimos la estructura de datos para las mesas del restaurante
const tableSchema = new Schema({
  // Número visible de la mesa, único en todo el local
  number: { type: Number, required: true, unique: true },
  // Estado operativo de la mesa: libre (disponible), ocupada (con clientes),
  // limpieza (recién desocupada, aún no lista) o reservada. Cambiar a 'libre'
  // o 'limpieza' cancela en cascada los pedidos activos de esa mesa (ver
  // tablesController.updateTable / bulkUpdateStatus)
  status: {
    type: String,
    enum: ['libre', 'ocupada', 'limpieza', 'reservada'],
    default: 'libre'
  },
  // Mesero que la está atendiendo actualmente (mientras está 'ocupada'). Se
  // limpia cuando la mesa pasa a 'limpieza' o 'libre'; el registro histórico
  // de quién la atendió siempre queda en cada Order (campo "waiter").
  currentWaiter: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  }
}, {
  // Registra fecha de creación y última actualización
  timestamps: true,
  // Permite guardar campos adicionales no definidos arriba
  strict: false
});

export default model("Tables", tableSchema);