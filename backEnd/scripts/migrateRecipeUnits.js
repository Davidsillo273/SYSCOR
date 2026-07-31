// Script de una sola corrida: migra los datos de recetas/inventario al nuevo
// esquema de unidades e inventario inteligente.
//
//   - "vaso" (unidad vieja, sin equivalencia estándar) -> "taza" (240 ml),
//     tanto en inventory.unit como en recipe[].unit de drinks y saucers.
//   - recipe[].quantity pasa de String a Number: se intentan parsear enteros,
//     decimales y fracciones ("1/2" -> 0.5). Lo que no se pueda parsear
//     ("una pizca", "al gusto") se deja en null y, si el ingrediente está
//     ligado a un insumo real, ese insumo se marca pending:true para que
//     salga en el aviso de "Atención" y el admin lo complete a mano.
//
// Uso: node scripts/migrateRecipeUnits.js   (desde la carpeta backEnd)
import mongoose from "mongoose";
import { config } from "../config.js";
import InventoryModel from "../src/models/inventory/inventoryModel.js";
import drinkModel from "../src/models/menu/drinksModel.js";
import SaucersModel from "../src/models/menu/saucersModel.js";

const summary = {
    inventoryUnitFixed: 0,
    drinksQuantityMigrated: 0,
    drinksQuantityNeedsReview: 0,
    saucersQuantityMigrated: 0,
    saucersQuantityNeedsReview: 0,
};

// Convierte un texto de cantidad a número cuando es posible: enteros,
// decimales y fracciones simples tipo "1/2". Devuelve null si no se puede.
const parseQuantity = (raw) => {
    if (raw === null || raw === undefined || raw === "") return null;
    if (typeof raw === "number") return raw;

    const text = String(raw).trim();

    // Fracción simple: "1/2", "3/4"
    const fractionMatch = text.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (fractionMatch) {
        const [, num, den] = fractionMatch;
        const denominator = Number(den);
        if (denominator === 0) return null;
        return Number(num) / denominator;
    }

    // Número simple, con coma o punto decimal
    const numberMatch = text.match(/^\d+([.,]\d+)?$/);
    if (numberMatch) {
        return Number(text.replace(",", "."));
    }

    return null;
};

const migrateInventoryUnits = async () => {
    const result = await InventoryModel.updateMany({ unit: "vaso" }, { unit: "taza" });
    summary.inventoryUnitFixed = result.modifiedCount || 0;
};

const migrateRecipeCollection = async (model, quantityCounterKey, reviewCounterKey) => {
    const docs = await model.find({ "recipe.0": { $exists: true } });

    for (const doc of docs) {
        let changed = false;

        for (const item of doc.recipe) {
            if (item.unit === "vaso") {
                item.unit = "taza";
                changed = true;
            }

            // Si ya es número (porque el documento se guardó ya con el schema
            // nuevo), no hay nada que migrar
            if (typeof item.quantity === "number") continue;

            const parsed = parseQuantity(item.quantity);
            if (parsed !== null) {
                item.quantity = parsed;
                summary[quantityCounterKey]++;
            } else {
                summary[reviewCounterKey]++;
                item.quantity = null;

                // Si el ingrediente está ligado a un insumo real, lo marcamos
                // pendiente para que el admin lo revise desde el aviso de Atención
                if (item.tracked && item.inventoryId) {
                    await InventoryModel.findByIdAndUpdate(item.inventoryId, { pending: true });
                }
            }
            changed = true;
        }

        if (changed) {
            doc.markModified("recipe");
            await doc.save();
        }
    }
};

const run = async () => {
    console.log("Conectando a la base de datos...");
    await mongoose.connect(config.db.uri);
    console.log("Conectado. Iniciando migración...\n");

    await migrateInventoryUnits();
    await migrateRecipeCollection(drinkModel, "drinksQuantityMigrated", "drinksQuantityNeedsReview");
    await migrateRecipeCollection(SaucersModel, "saucersQuantityMigrated", "saucersQuantityNeedsReview");

    console.log("=== Resumen de migración ===");
    console.log(`Insumos con unidad "vaso" -> "taza": ${summary.inventoryUnitFixed}`);
    console.log(`Ingredientes de bebidas migrados a número: ${summary.drinksQuantityMigrated}`);
    console.log(`Ingredientes de bebidas que requieren revisión manual: ${summary.drinksQuantityNeedsReview}`);
    console.log(`Ingredientes de platillos migrados a número: ${summary.saucersQuantityMigrated}`);
    console.log(`Ingredientes de platillos que requieren revisión manual: ${summary.saucersQuantityNeedsReview}`);
    console.log("\nListo. Los insumos que no se pudieron migrar quedaron marcados como");
    console.log("pendientes (aparecerán en el aviso de Atención de Inventario).");

    await mongoose.disconnect();
    process.exit(0);
};

run().catch((error) => {
    console.error("Error durante la migración:", error);
    process.exit(1);
});
