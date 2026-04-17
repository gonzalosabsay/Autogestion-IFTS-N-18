import { GoogleGenAI, Type } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "undefined" || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured. Please add VITE_GEMINI_API_KEY to your Vercel Environment Variables.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function extractFieldsFromTemplate(base64Image: string, mimeType: string) {
  const ai = getGenAI();
  const prompt = "Analiza esta imagen de una plantilla de formulario académico e identifica todos los campos que un alumno necesita completar. Devuelve el nombre del campo y una descripción breve.";

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            fieldId: { type: Type.STRING },
            label: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["text", "number", "date", "checkbox"] },
            required: { type: Type.BOOLEAN }
          },
          required: ["fieldId", "label", "type"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}

export async function autoFillFields(base64Image: string, mimeType: string, studentData: any) {
  const ai = getGenAI();
  const prompt = `Dada la siguiente información del alumno: ${JSON.stringify(studentData)}, identifica dónde iría cada dato en esta plantilla. Devuelve un mapeo de etiquetas de campos de la plantilla a los valores del alumno.`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mappings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                fieldId: { type: Type.STRING },
                value: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
