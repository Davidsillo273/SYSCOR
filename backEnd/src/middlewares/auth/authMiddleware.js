import jsonwebtoken from "jsonwebtoken";
import { config } from "../../../config.js";
import employeeModel from "../../models/users/employeeModel.js"; // ajusta la ruta según tu estructura

export const validateAuthCookie = (allowedTypes = []) => {
    return async (req, res, next) => {
        try {

            //#1- Extraer el token que está en la cookie (authCookie)
            //ya que en esa cookie está el rol del usuario que
            //inició sesión
            const { authCookie } = req.cookies;

            if (!authCookie) {
                return res.status(403).json({ message: "No cookie found, Authorization required" });
            }

            //Extraer toda la información de la cookie
            const decoded = jsonwebtoken.verify(authCookie, config.JWT.secret);

            // processLogin firma el token con "role", no "userType"
            if (!allowedTypes.includes(decoded.role)) {
                return res.status(401).json({ message: "Access denied" });
            }

            // Solo los empleados manejan permisos granulares + tokenVersion.
            // Esta única query extra solo corre para role === "employee",
            // así que admins y customers no pagan ese costo en cada request.
            if (decoded.role === "employee") {
                const employee = await employeeModel.findById(decoded.id).select("tokenVersion workInfo.status");

                if (!employee) {
                    return res.status(401).json({ message: "Account no longer exists. Please log in again." });
                }

                if (employee.workInfo.status !== "active") {
                    return res.status(403).json({ message: "Account is not active." });
                }

                // El tokenVersion del JWT quedó desactualizado: un admin
                // cambió los permisos de este empleado después de que se
                // generó este token. Se exige relogin para traer el array
                // de permisos actualizado.
                if (decoded.tokenVersion !== employee.tokenVersion) {
                    return res.status(401).json({ message: "Your permissions have changed. Please log in again." });
                }
            }

            // Disponible para los controllers de aquí en adelante
            req.user = decoded;

            next();

        } catch (error) {
            // Un token expirado o corrupto no es un error del servidor —
            // es que el usuario necesita volver a iniciar sesión
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Session expired, please log in again" });
            }
            if (error.name === "JsonWebTokenError") {
                return res.status(401).json({ message: "Invalid session token" });
            }

            console.error("validateAuthCookie error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };
};