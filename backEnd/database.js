// Importamos mongoose para poder interactuar con nuestra base de datos de MongoDB
import mongoose from "mongoose";
// Traemos las configuraciones, específicamente para obtener la URL de conexión
import { config } from "./config.js"

// Intentamos conectarnos a la base de datos utilizando la URI que tenemos en nuestra configuración
mongoose.connect(config.db.URI);

// Guardamos la conexión en una variable para poder escuchar sus eventos
const connection = mongoose.connection;

// Si la conexión se abre exitosamente, mostramos un mensaje de confirmación
connection.once("open", () => {
    console.log("DB is connected")
})

// Si en algún momento perdemos la conexión, lo registramos en la consola
connection.on("disconnected", () => {
    console.log("DB is disconnected")
})

// Si ocurre algún error con la base de datos, lo capturamos y lo mostramos
connection.on("error", (error) => {
    console.log("error found" + error)
})