import { GoogleGenAI } from "@google/genai";
import { TSAS_PLAN } from '../constants/academic-plan';
import { PRESENCIAL_CALENDAR } from '../constants/presencial-calendar';

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    // Check both Vite and Node env patterns for maximum compatibility
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

const SYSTEM_INSTRUCTION = `
Eres el Asistente Académico Inteligente del IFTS 18 para la carrera de Tecnicatura Superior en Análisis de Sistemas (TSAS).
Tu objetivo es ayudar a los estudiantes con dudas sobre su plan de estudios, correlatividades, horarios, docentes y el calendario de presencialidad.

CONTEXTO ACADÉMICO (TSAS):
${JSON.stringify(TSAS_PLAN, null, 2)}

CALENDARIO DE PRESENCIALIDAD (Semanas en las que se asiste al IFTS):
${JSON.stringify(PRESENCIAL_CALENDAR, null, 2)}

REGLAS DE COMPORTAMIENTO:
1. Sé EXTREMADAMENTE breve, directo y conciso. Responde en máximo 2 o 3 oraciones por cada punto si es posible.
2. No uses saludos excesivos o frases de relleno. Ve al grano.
3. Responde exclusivamente sobre la carrera TSAS.
4. Si un estudiante pregunta por correlatividades, enuméralas brevemente.
5. Si preguntan por horarios o presencialidad, responde con la información específica y puntual.
6. Usa Markdown minimalista (negritas para lo importante, listas cortas).
7. No inventes información.
`;

export async function chatWithAcademicAdvisor(messages: { role: 'user' | 'model', content: string }[]) {
  const ai = getGenAI();
  
  const history = messages.slice(0, -1).map(m => ({
    role: m.role as any,
    parts: [{ text: m.content }]
  }));
  
  const currentMessage = messages[messages.length - 1].content;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [...history, { role: 'user', parts: [{ text: currentMessage }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  return response.text;
}
