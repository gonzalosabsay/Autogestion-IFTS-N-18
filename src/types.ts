export type UserRole = 'student' | 'admin';

export type ProcedureType = 
  | 'alumno_regular' 
  | 'examen' 
  | 'equivalencias' 
  | 'reinscripcion';

export type ProcedureStatus = 
  | 'pending' 
  | 'in_review' 
  | 'approved' 
  | 'rejected';

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

export interface ProcedureRequest {
  id: string;
  studentId: string;
  type: ProcedureType;
  status: ProcedureStatus;
  caseNumber: string;
  data: Record<string, any>;
  submissionMethod: SubmissionMethod;
  authorityId?: string;
  rejectionReason?: string;
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
  reinscripcion: "Solicitud de Reinscripción"
};
