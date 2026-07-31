// Catálogo de unidades de medida del sistema y su conversión.
// Esta es la ÚNICA fuente de verdad para convertir cantidades: nunca se usa IA
// para esto, porque las conversiones tienen que ser exactas y predecibles.
//
// Cada unidad declara a qué grupo pertenece y cuánto vale en la unidad base de
// ese grupo (peso -> g, volumen -> ml, conteo -> unidad).
export const UNITS = {
    // --- Peso (base: g) ---
    g: { group: "peso", toBase: 1, label: "g" },
    kg: { group: "peso", toBase: 1000, label: "kg" },
    oz: { group: "peso", toBase: 28.3495, label: "oz" },
    lb: { group: "peso", toBase: 453.592, label: "lb" },

    // --- Volumen (base: ml) ---
    ml: { group: "volumen", toBase: 1, label: "ml" },
    l: { group: "volumen", toBase: 1000, label: "l" },

    // --- Conteo (base: unidad) ---
    // Ojo: estas NO son convertibles entre sí (un manojo no equivale a una pizca).
    // Solo se permite convertir una unidad de conteo a sí misma.
    unidad: { group: "conteo", toBase: 1, label: "unidad" },
    manojo: { group: "conteo", toBase: 1, label: "manojo" },
    pizca: { group: "conteo", toBase: 1, label: "pizca" },
    rebanada: { group: "conteo", toBase: 1, label: "rebanada" },
};

// Lista plana para usarla como enum en los modelos y en los <select> del front
export const UNIT_LIST = Object.keys(UNITS);

// Agrupadas, para mostrarlas ordenadas en la interfaz
export const UNITS_BY_GROUP = {
    peso: ["g", "kg", "oz", "lb"],
    volumen: ["ml", "l"],
    conteo: ["unidad", "manojo", "pizca", "rebanada"],
};

// Comprueba si una unidad existe en el catálogo
export const isValidUnit = (unit) => Object.prototype.hasOwnProperty.call(UNITS, unit);

// Convierte una cantidad entre dos unidades del mismo grupo.
// Lanza un error legible si las unidades no existen o son de grupos distintos,
// porque restar "3 unidades" de un insumo medido en kilos no tiene sentido.
export const convert = (quantity, fromUnit, toUnit) => {
    const amount = Number(quantity);

    if (isNaN(amount)) {
        throw new Error(`La cantidad "${quantity}" no es un número válido.`);
    }

    if (!isValidUnit(fromUnit)) {
        throw new Error(`La unidad "${fromUnit}" no existe en el catálogo.`);
    }

    if (!isValidUnit(toUnit)) {
        throw new Error(`La unidad "${toUnit}" no existe en el catálogo.`);
    }

    const from = UNITS[fromUnit];
    const to = UNITS[toUnit];

    if (from.group !== to.group) {
        throw new Error(
            `No se puede convertir de "${fromUnit}" (${from.group}) a "${toUnit}" (${to.group}).`
        );
    }

    // En el grupo de conteo cada unidad es su propia cosa: un manojo no son
    // N pizcas, así que solo dejamos pasar la conversión de una unidad a sí misma.
    if (from.group === "conteo" && fromUnit !== toUnit) {
        throw new Error(
            `No se puede convertir de "${fromUnit}" a "${toUnit}": las unidades de conteo no son equivalentes entre sí.`
        );
    }

    return (amount * from.toBase) / to.toBase;
};

// Igual que convert pero sin lanzar: útil cuando queremos acumular los errores
// en vez de cortar el flujo (ej. al descontar una receta completa).
export const tryConvert = (quantity, fromUnit, toUnit) => {
    try {
        return { ok: true, value: convert(quantity, fromUnit, toUnit) };
    } catch (error) {
        return { ok: false, error: error.message };
    }
};

export default { UNITS, UNIT_LIST, UNITS_BY_GROUP, isValidUnit, convert, tryConvert };
