import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { config } from "../../config.js";

// Le damos a Cloudinary nuestras credenciales para que nos deje subir archivos a su servicio
cloudinary.config({
  cloud_name: config.cloudinary.cloudinaryName,
  api_key: config.cloudinary.cloudinaryApiKey,
  api_secret: config.cloudinary.cloudinaryApiSecret,
});

// Le decimos en qué carpeta de Cloudinary se guardan las imágenes y qué tipos de archivo aceptamos
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "TaqueriaElCorralSyscor",
    allowed_formats: ["jpg", "png", "jpeg", "pdf", "doc"],
  },
});

// Middleware que recibe el archivo que sube el usuario y lo manda a Cloudinary
const upload = multer({ storage });

// El chat de IA usa memoria en vez de subir directo a Cloudinary, porque
// primero necesita el buffer crudo para mandarle la imagen a Gemini en base64
// (ver assistantChatController.js). El propio cliente `cloudinary` configurado
// arriba se reexporta para que ese controller pueda subir el archivo después,
// una vez decide que vale la pena conservarlo.
const uploadToMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

export default upload;
export { cloudinary, uploadToMemory };
