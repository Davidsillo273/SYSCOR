// Importamos Cloudinary para poder borrar imágenes ya subidas
import { v2 as cloudinary } from "cloudinary";

// Los modelos de admin y empleado solo guardan la URL final de la imagen
// (a diferencia de bebidas/platillos/combos, que sí guardan el public_id
// aparte). Para poder borrar la foto anterior de Cloudinary cuando suben una
// nueva, hay que reconstruir el public_id a partir de esa URL.
//
// Ejemplo de URL: https://res.cloudinary.com/<cloud>/image/upload/v1234567890/TaqueriaElCorralSyscor/abc123.jpg
// public_id esperado: TaqueriaElCorralSyscor/abc123
const extractPublicId = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== "string") return null;

    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    return match ? match[1] : null;
};

// Borra de Cloudinary la imagen anterior de un perfil. Si la URL no tiene un
// formato reconocible o Cloudinary falla, solo lo registramos en consola:
// no tiene sentido que la actualización del perfil falle por esto.
const deletePreviousImage = async (imageUrl) => {
    const publicId = extractPublicId(imageUrl);
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("cloudinaryUtils.deletePreviousImage:", error);
    }
};

export default { extractPublicId, deletePreviousImage };
