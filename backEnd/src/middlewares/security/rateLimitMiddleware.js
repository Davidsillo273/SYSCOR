// Limitadores de velocidad (rate limiting) para proteger la API contra abuso
// y ataques de fuerza bruta. Usan express-rate-limit, que cuenta peticiones
// por IP dentro de una ventana de tiempo y responde 429 cuando se supera el
// límite, sin necesidad de tocar la lógica de cada controller.
import rateLimit from "express-rate-limit";

// Formato de respuesta consistente con el resto del sistema ({title, message}),
// igual al que usan los controllers en sus errores.
const rateLimitResponse = (title, message) => (req, res) => {
  res.status(429).json({ title, message });
};

// Limitador global: se aplica a TODAS las rutas de la API. 300 peticiones
// cada 15 minutos por IP es generoso para el uso normal de un panel (varias
// pestañas, polling de notificaciones, dashboards con refresco automático)
// pero corta scraping agresivo o loops descontrolados del frontend.
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 300,
  standardHeaders: true, // manda los headers RateLimit-* estándar
  legacyHeaders: false, // no manda los headers X-RateLimit-* viejos
  handler: rateLimitResponse(
    "Demasiadas solicitudes",
    "Has alcanzado el límite de solicitudes. Intenta de nuevo en unos minutos."
  ),
});

// Limitador estricto para endpoints de autenticación (login de admin,
// empleado y cliente, y recuperación de contraseña): un límite mucho más
// bajo (10 intentos cada 15 minutos por IP) para dificultar ataques de
// fuerza bruta contra contraseñas, sin bloquear a un usuario real que solo
// se equivocó un par de veces.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse(
    "Demasiados intentos",
    "Demasiados intentos de inicio de sesión. Por seguridad, intenta de nuevo en unos minutos."
  ),
});
