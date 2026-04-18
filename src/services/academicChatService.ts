import { GoogleGenAI } from "@google/genai";
import { TSAS_PLAN } from '../constants/academic-plan';
import { PRESENCIAL_CALENDAR } from '../constants/presencial-calendar';

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAI) {
    // Check for variables safely in the browser environment
    let apiKey = '';
    
    try {
      // @ts-ignore - Vite environment
      apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    } catch (e) {
      // import.meta.env might not be available in all contexts
    }

    if (!apiKey) {
      try {
        // @ts-ignore - Node environment fallback
        apiKey = process.env.GEMINI_API_KEY || '';
      } catch (e) {
        // process might not be defined in browser
      }
    }

    if (!apiKey) {
      throw new Error("MISSING_API_KEY");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

const SYSTEM_INSTRUCTION = `
Eres el Asistente Académico Inteligente del IFTS 18 para la carrera de Tecnicatura Superior en Análisis de Sistemas (TSAS).
Tu objetivo es ayudar a los estudiantes con dudas sobre su plan de estudios, correlatividades, horarios, docentes y el calendario de presencialidad.

ESTRUCTURA DEL PLAN DE ESTUDIOS (TSAS):
La carrera tiene 5 cuatrimestres de cursada (1.1, 1.2, 2.1, 2.2, 3.1).
IMPORTANTE: No confundir el "Cuatrimestre del Plan" con el "Cuatrimestre del Calendario Académico".
- Materias del 1°, 2°, 3°, 4° y 5° cuatrimestre del PLAN se cursan en el cuatrimestre vigente del CALENDARIO.
- Actualmente la información corresponde al 1er Cuatrimestre del Calendario Académico (Marzo a Julio). Por lo tanto, SI hay calendario de presencialidad para materias etiquetadas como "2do Cuatrimestre" o "4to Cuatrimestre" en el plan, siempre que figuren en los datos.

REGLAS DE TRÁMITES:
- Solicitud de Readmisión: Es un trámite 100% digital. NO requiere impresión física ni firma manuscrita. Se firma digitalmente en el sistema.
- Solicitud de Cambio de Carrera: Es un trámite 100% digital. Solo genera expediente digital, no requiere PDF ni impresión.
- Constancia de Alumno Regular: Digital y automática.

DATOS DEL PLAN:
${JSON.stringify(TSAS_PLAN, null, 2)}

CALENDARIO DE PRESENCIALIDAD (Semanas de asistencia física para el cuatrimestre actual):
${JSON.stringify(PRESENCIAL_CALENDAR, null, 2)}

REGLAS DE COMPORTAMIENTO:
1. Sé EXTREMADAMENTE breve, directo y conciso.
2. Si una materia tiene datos en el calendario de presencialidad, informa las fechas aunque la materia diga "2do Cuatrimestre" en el plan.
3. No uses frases de relleno. Ve al grano.
4. Responde exclusivamente sobre la carrera TSAS.
5. Usa Markdown minimalista.
6. No inventes información. Si no sabes algo, dilo.
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
