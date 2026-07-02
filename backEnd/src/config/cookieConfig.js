// Configuración por defecto para las cookies de nuestra aplicación
const cookieConfig = {
    // Evita que la cookie pueda ser leída por scripts del cliente (como JavaScript en el navegador), 
    // lo cual ayuda a prevenir ataques de robo de sesión (XSS)
    httpOnly: true,
    // Tiempo de vida de la cookie en milisegundos. 
    // En este caso, está configurada para durar 30 días (30 días * 24 horas * 60 minutos * 60 segundos * 1000 milisegundos)
    maxAge: 30 * 24 * 60 * 60 * 1000,
};

// Exportamos esta configuración para usarla donde la necesitemos (por ejemplo, al iniciar sesión)
export default cookieConfig;