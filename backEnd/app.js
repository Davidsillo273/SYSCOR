// Importamos las herramientas necesarias para construir nuestro servidor
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// Importamos todas nuestras rutas desde el archivo principal de rutas
import allRoutes from "./src/routes/allRoutes/index.js";
// Middleware que identifica al usuario sin bloquear las rutas públicas
import { attachUser } from "./src/middlewares/auth/authMiddleware.js";

// Inicializamos la aplicación de Express
const app = express();

// --- Middlewares ---
// Los middlewares son como filtros que procesan la información antes de llegar a las rutas

// Configuramos CORS para permitir que el frontend se comunique con nuestro backend
app.use(cors({
    // Definimos qué orígenes tienen permiso para hacer peticiones
    origin: ["http://localhost:5173", "http://localhost:5174"],
    // Permitimos el envío de credenciales como las cookies
    credentials: true,
}));

// Usamos cookie-parser para poder leer y manejar las cookies que nos envían los usuarios
app.use(cookieParser());
// Permitimos que nuestra aplicación pueda entender los datos que vienen en formato JSON
app.use(express.json());

// Intentamos identificar al usuario en TODAS las peticiones (sin bloquear ninguna).
// Gracias a esto las notificaciones pueden decir quién realizó cada movimiento.
app.use(attachUser);

// Definimos la ruta base para nuestra API, por defecto usamos "/api"
const api = process.env.API_URL || "/api";

// --- Rutas ---
// Le decimos a la aplicación que utilice todas las rutas que importamos bajo la ruta base
// Todas las rutas se encuentran en: ./routes/index.js
app.use(api, allRoutes);

// Exportamos la aplicación para poder usarla en otros archivos (como en index.js)
export default app;