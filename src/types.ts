export type UserRole = 'student' | 'admin';

export type ProcedureType = 
  | 'alumno_regular' 
  | 'examen' 
  | 'equivalencias' 
  | 'readmision'
  | 'pase'
  | 'cambio_carrera';

export type ProcedureStatus = 
  | 'pending' 
  | 'in_review' 
  | 'approved' 
  | 'rejected'
  | 'action_required';

export interface UserProfile {
  uid: string;
  dni: string;
  fullName: string;
  career: string;
  birthDate?: string;
  email: string;
  role: UserRole;
}

export interface Authority {
  id: string;
  name: string;
  position: string;
  signatureUrl?: string;
}

export type SubmissionMethod = 'print' | 'digital';

export interface ProcedureMessage {
  id: string;
  senderRole: UserRole;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface ProcedureRequest {
  id: string;
  studentId: string;
  studentName?: string;
  studentDni?: string;
  type: ProcedureType;
  status: ProcedureStatus;
  caseNumber: string;
  data: Record<string, any>;
  submissionMethod: SubmissionMethod;
  authorityId?: string;
  rejectionReason?: string;
  messages?: ProcedureMessage[];
  certificateTramiteNumber?: string;
  assignedAdminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateField {
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
}

export interface ProcedureTemplate {
  id: ProcedureType;
  fields: TemplateField[];
  updatedAt: string;
}

export const PROCEDURE_LABELS: Record<ProcedureType, string> = {
  alumno_regular: "Constancia de Alumno Regular",
  examen: "Constancia de Examen",
  equivalencias: "Solicitud de Equivalencias",
  readmision: "Solicitud de Readmisión",
  pase: "Solicitud de Pase",
  cambio_carrera: "Solicitud de Cambio de Carrera"
};
