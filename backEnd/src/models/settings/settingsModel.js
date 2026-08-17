import { Schema, model } from "mongoose";

// Este modelo guarda UN SOLO documento con la configuración del restaurante.
// No hay un documento por usuario: son ajustes globales que el administrador
// define y que afectan a todo el sistema (dashboard, alertas, notificaciones).
const settingsSchema = new Schema({
    // Ajustes del día a día de la operación
    operation: {
        // A partir de cuántas unidades se considera "agotado"/bajo stock,
        // configurable por separado para cada sección del sistema. Inventario no
        // tiene entrada aquí: su umbral es obligatorio por insumo (ver
        // inventoryModel.lowStockAlert), así que no existe un umbral general.
        lowStockThresholds: {
            drinks: { type: Number, default: 10 },
            saucers: { type: Number, default: 10 },
            extras: { type: Number, default: 10 },
            combos: { type: Number, default: 10 }
        },
        // Si el panel debe recargar sus datos solo, sin que el usuario refresque
        autoRefreshDashboard: { type: Boolean, default: true },
        // Cada cuántos segundos se recarga el panel cuando lo anterior está activo
        dashboardRefreshSeconds: { type: Number, default: 60 }
    },
    // Interruptores para decidir qué movimientos generan notificación.
    // Si una categoría se apaga, esos eventos dejan de registrarse.
    notifications: {
        orders: { type: Boolean, default: true },
        staff: { type: Boolean, default: true },
        inventory: { type: Boolean, default: true },
        tables: { type: Boolean, default: true },
        menu: { type: Boolean, default: true },
        clients: { type: Boolean, default: true }
    }
}, {
    timestamps: true,
    strict: true
});

export default model("Settings", settingsSchema);
