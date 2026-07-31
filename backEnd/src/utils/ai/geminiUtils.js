// Cliente mínimo para llamar a Gemini (Google AI) usando fetch nativo — Node
// 24 ya lo trae, así que no hace falta ninguna dependencia nueva.
//
// Reglas de este archivo, importantes:
// - Nunca se usa para convertir unidades ni para descontar inventario: eso
//   siempre pasa por unitsUtils/deductionUtils, que son deterministas.
// - Si no hay API key, o Gemini tarda, o responde algo raro: se devuelve null
//   y quien llamó sigue funcionando sin la sugerencia. Nunca se lanza un error
//   que rompa el flujo del admin.
import { config } from "../../../config.js";

const GEMINI_ENDPOINT = (model) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Le pide a Gemini una respuesta en JSON puro para un prompt dado.
// Devuelve el objeto ya parseado, o null si algo falló en el camino.
export const callGemini = async (prompt) => {
    const apiKey = config.gemini.apiKey;
    if (!apiKey) {
        console.warn("geminiUtils.callGemini: GEMINI_API_KEY no configurada, se omite la sugerencia de IA.");
        return null;
    }

    try {
        const response = await fetch(`${GEMINI_ENDPOINT(config.gemini.model)}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.4,
                },
            }),
            // No dejamos que una llamada colgada bloquee la petición del admin
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            console.error("geminiUtils.callGemini: respuesta no OK de Gemini", response.status);
            return null;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        try {
            return JSON.parse(text);
        } catch {
            console.error("geminiUtils.callGemini: Gemini no devolvió JSON válido");
            return null;
        }
    } catch (error) {
        // Timeout, red caída, lo que sea: la IA es un extra, no un requisito
        console.error("geminiUtils.callGemini:", error.message);
        return null;
    }
};

export default { callGemini };
