// Cargamos las variables de entorno desde el archivo .env para poder usarlas aquí abajo
import dotenv from "dotenv"

// Leemos el archivo .env y lo volcamos en process.env
dotenv.config();

// Este objeto junta toda la configuración sensible del sistema (claves, URLs,
// credenciales) en un solo lugar, para no tener variables de entorno sueltas
// por todo el código
export const config = {
    // Datos para conectarnos a la base de datos
    db: {
        uri: process.env.DB_URI
    },
    // Clave secreta con la que firmamos y verificamos las sesiones de los usuarios
    jwt: {
        secret: process.env.JWT_Secret_key
    },
    // Cuenta de correo desde la que el sistema manda los emails (códigos, invitaciones, etc.)
    email: {
        userEmail: process.env.USER_EMAIL,
        userPassword: process.env.USER_PASSWORD
    },
    // Credenciales de Cloudinary, el servicio donde guardamos las imágenes que suben los admins
    cloudinary: {
        cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME,
        cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
        cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET
    },
    // Dirección donde vive nuestro propio backend
    appUrl: process.env.APP_URL,
    // Credenciales para conectarnos con Wompi, la pasarela que procesa los pagos
    wompi: {
        grantType: process.env.GRANT_TYPE,
        audience: process.env.AUDIENCE,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET
    },
    // Dirección del frontend. La usamos para permitirle hacer peticiones al
    // backend sin que el navegador las bloquee (CORS). Si no está definida,
    // asumimos que estamos en desarrollo local
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
    // Credenciales para pedirle ayuda a la IA (sugerir recetas, proyectar
    // cuándo se va a agotar un insumo). Si falta la clave, esas funciones
    // simplemente no responden nada: nunca frenan el resto del sistema
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        // "gemini-2.5-flash-lite" ya no está disponible para proyectos nuevos
        // (Google la retiró y devuelve error 404). "gemini-flash-lite-latest"
        // es el alias que Google mantiene apuntando siempre al modelo
        // flash-lite vigente, así no se vuelve a romper cuando cambien de versión
        model: process.env.GEMINI_MODEL || "gemini-flash-lite-latest"
    }
}
