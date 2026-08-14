// Script de una sola corrida: el modelo Order ahora requiere el campo
// "orderType" ('local' | 'online') para poder distinguir pedidos tomados en
// el restaurante de pedidos hechos en línea. Los pedidos ya existentes en la
// base de datos vienen todos del flujo de meseros/mesas (no existía el flujo
// online todavía), así que se marcan como "local".
//
// Uso: node scripts/migrateOrderType.js   (desde la carpeta backEnd)
import mongoose from "mongoose";
import { config } from "../config.js";
import OrderModel from "../src/models/orders/orderModel.js";

const run = async () => {
  console.log("Conectando a la base de datos...");
  await mongoose.connect(config.db.uri);
  console.log("Conectado. Migrando pedidos sin orderType...\n");

  const result = await OrderModel.updateMany(
    { orderType: { $exists: false } },
    { $set: { orderType: "local" } }
  );

  console.log(`Pedidos existentes marcados como "local": ${result.modifiedCount}`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error("Error durante la migración:", error);
  process.exit(1);
});
