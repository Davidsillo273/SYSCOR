// En local, frontend y backend comparten "sitio" (mismo dominio raíz, solo
// cambia el puerto), así que "lax" basta. En producción, Vercel y Render son
// dominios distintos: el navegador solo manda la cookie en peticiones
// cross-site si es "none" + secure: true (obligatorio con HTTPS).
const isCrossSiteProd = Boolean(process.env.FRONTEND_URL);

// Configuración por defecto para las cookies de nuestra aplicación
const cookieConfig = {
    // Evita que la cookie pueda ser leída por scripts del cliente (como JavaScript en el navegador),
    // lo cual ayuda a prevenir ataques de robo de sesión (XSS)
    httpOnly: true,
    // Tiempo de vida de la cookie en milisegundos.
    // En este caso, está configurada para durar 30 días (30 días * 24 horas * 60 minutos * 60 segundos * 1000 milisegundos)
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: isCrossSiteProd ? "none" : "lax",
    secure: isCrossSiteProd,
};

export default cookieConfig;