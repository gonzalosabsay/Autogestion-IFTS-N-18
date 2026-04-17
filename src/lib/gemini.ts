import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractFieldsFromTemplate(base64Image: string, mimeType: string) {
  const prompt = "Analiza esta imagen de una plantilla de formulario académico e identifica todos los campos que un alumno necesita completar. Devuelve el nombre del campo y una descripción breve.";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: "Actúa como un administrativo universitario experto.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            fieldId: { type: Type.STRING, description: "Un identificador único para el campo (ej: nombre_completo)" },
            label: { type: Type.STRING, description: "La etiqueta legible del campo (ej: Nombre Completo)" },
            type: { type: Type.STRING, enum: ["text", "number", "date", "checkbox"], description: "El tipo de dato esperado" },
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
  const prompt = `Dada la siguiente información del alumno: ${JSON.stringify(studentData)}, identifica dónde iría cada dato en esta plantilla. Devuelve un mapeo de etiquetas de campos de la plantilla a los valores del alumno.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: "Eres un asistente experto en procesamiento de documentos académicos.",
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
