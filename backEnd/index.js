// Importamos la aplicación principal y la conexión a la base de datos
import app from "./app.js";
import "./database.js";

// Esta función se encarga de iniciar el servidor
async function main() {
    // Le decimos a la aplicación que escuche las peticiones en el puerto 4000
    app.listen(4000);
    // Mostramos un mensaje en la consola para confirmar que el servidor está funcionando
    console.log("Server on port 4000");
}

// Ejecutamos la función principal para arrancar todo
main();