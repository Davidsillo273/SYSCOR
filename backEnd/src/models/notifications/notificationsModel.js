import mongoose, { Schema, model } from "mongoose";

// Cada documento representa UN movimiento ocurrido en el sistema
// (una orden creada, un insumo con stock bajo, un empleado registrado, etc.)
const notificationSchema = new Schema({
    // Área del sistema a la que pertenece el movimiento
    category: {
        type: String,
        required: true,
        enum: ["orders", "staff", "inventory", "tables", "menu", "clients", "settings"]
    },
    // Qué se hizo exactamente
    action: {
        type: String,
        required: true,
        enum: ["created", "updated", "deleted", "status_changed", "low_stock", "registered", "invited"]
    },
    // Título corto que se muestra en negrita en la campana
    title: { type: String, required: true },
    // Texto ya redactado en español, listo para mostrar
    message: { type: String, required: true },
    // Nombre del icono de Font Awesome (sin el prefijo "fa-")
    icon: { type: String, default: "bell" },
    // Determina el color con el que se pinta la notificación
    severity: {
        type: String,
        enum: ["info", "success", "warning", "danger"],
        default: "info"
    },
    // Foto del momento de quién hizo el movimiento.
    // Se guarda copiado (no como referencia) porque el actor puede vivir en
    // tres colecciones distintas (admin, empleado o cliente), y así la
    // notificación conserva el nombre original aunque después editen el perfil.
    actor: {
        id: { type: mongoose.Schema.Types.ObjectId, default: null },
        role: { type: String, default: "system" },
        name: { type: String, default: "Sistema" },
        image: { type: String, default: null }
    },
    // A qué registro apunta la notificación (para poder enlazarla desde la interfaz)
    entity: {
        model: { type: String, default: null },
        id: { type: mongoose.Schema.Types.ObjectId, default: null },
        label: { type: String, default: null }
    },
    // Roles que tienen permiso de ver esta notificación.
    // Los movimientos sensibles (personal, clientes, ajustes) solo llegan al admin.
    audience: {
        type: [String],
        default: ["admin"]
    },
    // Ids de los usuarios que ya la marcaron como leída.
    // Guardarlo aquí evita tener una colección aparte por usuario.
    readBy: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    }
}, {
    // Guarda automáticamente la fecha de creación (la usamos para ordenar y mostrar "hace X minutos")
    timestamps: true,
    strict: true
});

// Índice para que la consulta de la campana (filtrar por rol y ordenar por fecha) sea rápida
notificationSchema.index({ audience: 1, createdAt: -1 });

// Índice TTL: MongoDB borra automáticamente cada notificación 3 días después
// de su createdAt (259200 segundos). No hace falta ningún cron ni tarea
// programada aparte, la propia base de datos limpia el historial viejo.
const THREE_DAYS_IN_SECONDS = 60 * 60 * 24 * 3;
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: THREE_DAYS_IN_SECONDS });

export default model("Notification", notificationSchema);
