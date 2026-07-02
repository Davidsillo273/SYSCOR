// Importamos dotenv para poder leer las variables de entorno desde nuestro archivo .env
import dotenv from "dotenv"

// Ejecutamos la configuración inicial para cargar las variables
dotenv.config();

// Exportamos un objeto con todas las configuraciones ordenadas por categorías
// Esto nos facilita el acceso a estas variables en cualquier parte del proyecto
export const config = {
    // Configuración para la conexión a la base de datos
    db: {
        URI: process.env.DB_URI
    },
    // Configuración para los tokens de seguridad (JWT)
    JWT: {
        secret: process.env.JWT_Secret_key
    },
    // Credenciales para el envío de correos electrónicos
    email: {
        user_email: process.env.USER_EMAIL,
        user_password: process.env.USER_PASSWORD
    },
    // Credenciales de Cloudinary, usado para subir y gestionar imágenes
    cloudinary:{
        cloudinary_name:  process.env.CLOUDINARY_CLOUD_NAME,
        cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
        cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET
    },
    // URL principal de nuestra aplicación
    appUrl: process.env.APP_URL,
    // Credenciales para la integración con la pasarela de pagos Wompi
    wompi: {
        grant_type: process.env.GRANT_TYPE,
        audience: process.env.AUDIENCE,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
    },
    // URL del frontend para permitir las conexiones de origen cruzado (CORS)
    // Si no existe la variable, usamos localhost:5173 por defecto
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
}
