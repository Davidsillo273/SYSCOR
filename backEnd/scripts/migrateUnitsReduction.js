// Script de una sola corrida: reduce el catálogo de unidades de volumen a
// solo "ml" y "l" (se eliminan cucharadita/cucharada/taza/onza_liquida) y
// mueve la lógica de "insumo compuesto" de Inventario a Extras.
//
//   - Toda cantidad guardada en una unidad de volumen eliminada se convierte
//     a "ml" usando el factor que tenía esa unidad (cucharadita=5,
//     cucharada=15, taza=240, onza_liquida=29.5735), tanto en
//     inventory.unit/quantity como en recipe[].unit/quantity de bebidas y
//     platillos, y en ingredients[].unit/quantity de extras.
//   - Los insumos de Inventario que tenían isCompound:true pierden esa
//     lógica (ahora vive en Extras): el script solo IMPRIME un listado para
//     que el admin recree manualmente esas recetas como Extras si hace
//     falta; no borra nada de inventory.recipe (queda como dato huérfano,
//     inofensivo, hasta que se limpie a mano).
//
// Uso: node scripts/migrateUnitsReduction.js   (desde la carpeta backEnd)
import mongoose from "mongoose";
import { config } from "../config.js";
import InventoryModel from "../src/models/inventory/inventoryModel.js";
import drinkModel from "../src/models/menu/drinksModel.js";
import SaucersModel from "../src/models/menu/saucersModel.js";
import ExtrasModel from "../src/models/menu/extrasModel.js";

// Factores toBase de las unidades eliminadas (ya no existen en unitsUtils.js)
const REMOVED_UNITS_TO_ML = {
    cucharadita: 5,
    cucharada: 15,
    taza: 240,
    onza_liquida: 29.5735,
};

const summary = {
    inventoryUnitsFixed: 0,
    drinksIngredientsFixed: 0,
    saucersIngredientsFixed: 0,
    extrasIngredientsFixed: 0,
};

const convertToMl = (quantity, unit) => {
    const factor = REMOVED_UNITS_TO_ML[unit];
    if (!factor || quantity === null || quantity === undefined) return null;
    return Number(quantity) * factor;
};

const migrateInventoryUnits = async () => {
    const docs = await InventoryModel.find({ unit: { $in: Object.keys(REMOVED_UNITS_TO_ML) } });
    for (const doc of docs) {
        const converted = convertToMl(doc.quantity, doc.unit);
        doc.unit = "ml";
        if (converted !== null) doc.quantity = converted;
        await doc.save();
        summary.inventoryUnitsFixed++;
    }
};

const migrateRecipeCollection = async (model, counterKey) => {
    const docs = await model.find({ "recipe.unit": { $in: Object.keys(REMOVED_UNITS_TO_ML) } });
    for (const doc of docs) {
        let changed = false;
        for (const item of doc.recipe) {
            if (Object.prototype.hasOwnProperty.call(REMOVED_UNITS_TO_ML, item.unit)) {
                const converted = convertToMl(item.quantity, item.unit);
                item.unit = "ml";
                if (converted !== null) item.quantity = converted;
                changed = true;
                summary[counterKey]++;
            }
        }
        if (changed) {
            doc.markModified("recipe");
            await doc.save();
        }
    }
};

const migrateExtrasIngredients = async () => {
    const docs = await ExtrasModel.find({ "ingredients.unit": { $in: Object.keys(REMOVED_UNITS_TO_ML) } });
    for (const doc of docs) {
        let changed = false;
        for (const item of doc.ingredients) {
            if (Object.prototype.hasOwnProperty.call(REMOVED_UNITS_TO_ML, item.unit)) {
                const converted = convertToMl(item.quantity, item.unit);
                item.unit = "ml";
                if (converted !== null) item.quantity = converted;
                changed = true;
                summary.extrasIngredientsFixed++;
            }
        }
        if (changed) {
            doc.markModified("ingredients");
            await doc.save();
        }
    }
};

const listOldCompoundInventory = async () => {
    const compounds = await InventoryModel.find({ isCompound: true }).select("name recipe");
    return compounds;
};

const run = async () => {
    console.log("Conectando a la base de datos...");
    await mongoose.connect(config.db.uri);
    console.log("Conectado. Iniciando migración...\n");

    await migrateInventoryUnits();
    await migrateRecipeCollection(drinkModel, "drinksIngredientsFixed");
    await migrateRecipeCollection(SaucersModel, "saucersIngredientsFixed");
    await migrateExtrasIngredients();
    const oldCompounds = await listOldCompoundInventory();

    console.log("=== Resumen de migración de unidades ===");
    console.log(`Insumos de Inventario reconvertidos a "ml": ${summary.inventoryUnitsFixed}`);
    console.log(`Ingredientes de bebidas reconvertidos a "ml": ${summary.drinksIngredientsFixed}`);
    console.log(`Ingredientes de platillos reconvertidos a "ml": ${summary.saucersIngredientsFixed}`);
    console.log(`Ingredientes de extras reconvertidos a "ml": ${summary.extrasIngredientsFixed}`);

    if (oldCompounds.length > 0) {
        console.log(`\n${oldCompounds.length} insumo(s) de Inventario tenían isCompound:true.`);
        console.log("Esa lógica ahora vive en Extras. Revísalos y recrea la receta como un");
        console.log("Extra si corresponde (su recipe[] en Inventory queda sin usarse):");
        oldCompounds.forEach((c) => console.log(`  - ${c.name} (${c._id})`));
    } else {
        console.log("\nNo había insumos de Inventario marcados como compuestos.");
    }

    await mongoose.disconnect();
    process.exit(0);
};

run().catch((error) => {
    console.error("Error durante la migración:", error);
    process.exit(1);
});
