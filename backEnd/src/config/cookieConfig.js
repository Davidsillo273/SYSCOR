// Configuración por defecto para las cookies de nuestra aplicación
const cookieConfig = {
    // Evita que la cookie pueda ser leída por scripts del cliente (como JavaScript en el navegador), 
    // lo cual ayuda a prevenir ataques de robo de sesión (XSS)
    httpOnly: true,
    // Tiempo de vida de la cookie en milisegundos. 
    // En este caso, está configurada para durar 30 días (30 días * 24 horas * 60 minutos * 60 segundos * 1000 milisegundos)
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // "lax" permite que la cookie viaje entre localhost:5173 (frontend) y
    // localhost:4000 (backend) porque, aunque los puertos son distintos,
    // ambos cuentan como el mismo "sitio" (misma raíz de dominio). Si en
    // producción el frontend y el backend quedan en dominios DIFERENTES
    // (ej. app.syscor.com y api.syscor.com), aquí habría que cambiar a
    // "none" y agregar secure: true (obligatorio con HTTPS).
    sameSite: "lax",
};

export default cookieConfig;