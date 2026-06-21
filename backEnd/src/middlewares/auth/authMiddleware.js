import jsonwebtoken from "jsonwebtoken";
import { config } from "../../../config.js";

export const validateAuthCookie = (allowedTypes = []) =>{
    return (req, res, next) =>{
        try {
            
            //#1- Extraer el token que está en la cookie (authCookie)
            //ya que en esa cookie está el tipo de usuario que
            //inició sesión
            const {authCookie} = req.cookies;
            
            if(!authCookie){
                return res.status(403).json({message: "No cookie found, Authorization required"})
            }

            //Extraer toda la información de la cookie
            const decoded = jsonwebtoken.verify(authCookie, config.JWT.secret)

            if(!allowedTypes.includes(decoded.userType)){
                return res.status(401).json({message: "Access denied"})
            }

            next()

        } catch (error) {
            console.log("error"+error)
            return res.status(500).json({message: "Internal server errro"})
        }
    }
}