//Middelware de ejemplo paara subir archivo

const checkRole = (...rolesPermitidos) => {
    return (req, res, next) => {
        try {
            // Verifica que exista el usuario en el request
            // (debe venir de un middleware de autenticación previo)
            if (!req.user) {
                return res.status(401).json({ message: "No autenticado" });
            }

            const { role } = req.user;

            // Verifica si el rol del usuario está entre los permitidos
            if (!rolesPermitidos.includes(role)) {
                return res.status(403).json({
                    message: "Acceso denegado: no tienes permisos para esta acción",
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({ message: "Error al verificar el rol" });
        }
    };
};

export default checkRole;