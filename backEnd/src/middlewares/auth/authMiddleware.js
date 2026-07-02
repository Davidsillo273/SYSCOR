import jsonwebtoken from "jsonwebtoken";
import { config } from "../../../config.js";
import employeeModel from "../../models/users/employeeModel.js";

// Este middleware actúa como un guardia de seguridad. Verifica si el usuario tiene permiso para acceder a cierta ruta.
// 'allowedTypes' es una lista de los roles que tienen permitido pasar (por ejemplo: admin, empleado, cliente).
export const validateAuthCookie = (allowedTypes = []) => {
    return async (req, res, next) => {
        try {
            // #1 - Extraemos la galleta (cookie) llamada 'authCookie' que nos envía el usuario.
            // Aquí es donde está guardado el token que confirma quién inició sesión.
            const { authCookie } = req.cookies;

            // Si el usuario no nos envió la cookie, no lo dejamos pasar.
            if (!authCookie) {
                return res.status(403).json({ message: "No cookie found, Authorization required" });
            }

            // Desciframos la información que está adentro del token usando nuestra llave secreta.
            const decoded = jsonwebtoken.verify(authCookie, config.JWT.secret);

            // Revisamos si el rol del usuario (que viene dentro del token) está en la lista de permitidos.
            if (!allowedTypes.includes(decoded.role)) {
                return res.status(401).json({ message: "Access denied" });
            }

            // Los empleados tienen reglas de permisos más complejas (pueden cambiar si el jefe lo decide).
            // Por eso, solo si es empleado, hacemos una verificación extra en la base de datos.
            if (decoded.role === "employee") {
                // Buscamos al empleado en la base de datos para ver su estado actual y la versión de sus permisos
                const employee = await employeeModel.findById(decoded.id).select("tokenVersion workInfo.status");

                // Si por alguna razón el empleado ya no existe (fue borrado)
                if (!employee) {
                    return res.status(401).json({ message: "Account no longer exists. Please log in again." });
                }

                // Si el empleado está suspendido o inactivo, no lo dejamos continuar
                if (employee.workInfo.status !== "active") {
                    return res.status(403).json({ message: "Account is not active." });
                }

                // Si la versión de los permisos en el token es diferente a la de la base de datos,
                // significa que un administrador le cambió los permisos recientemente.
                // Le pedimos que inicie sesión otra vez para actualizar su token.
                if (decoded.tokenVersion !== employee.tokenVersion) {
                    return res.status(401).json({ message: "Your permissions have changed. Please log in again." });
                }
            }

            // Guardamos la información del usuario descifrada en la petición (req.user).
            // De esta forma, las siguientes partes del código pueden saber quién está haciendo la petición.
            req.user = decoded;

            // Todo está bien, dejamos que la petición continúe su camino
            next();

        } catch (error) {
            // Si el token ya caducó (pasó el tiempo límite)
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Session expired, please log in again" });
            }
            // Si el token fue modificado, está dañado o es inventado
            if (error.name === "JsonWebTokenError") {
                return res.status(401).json({ message: "Invalid session token" });
            }

            // Si ocurre cualquier otro error inesperado, lo registramos y devolvemos error 500
            console.error("validateAuthCookie error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };
};