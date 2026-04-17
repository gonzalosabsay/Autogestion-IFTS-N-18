import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ProcedureRequest, Authority, PROCEDURE_LABELS, UserProfile } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { X, CheckCircle, Clock, XCircle, User, FileText, Fingerprint, Loader2, Save, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateProcedurePDF } from '../../lib/pdf';

interface DetailsProps {
  procedure: ProcedureRequest;
  profile: UserProfile | null;
  onClose: () => void;
}

export default function ProcedureDetails({ procedure, profile, onClose }: DetailsProps) {
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [selectedAuthority, setSelectedAuthority] = useState(procedure.authorityId || '');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [templateLabels, setTemplateLabels] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  useEffect(() => {
    // Load authorities for signing
    const unsubscribe = onSnapshot(collection(db, 'authorities'), (snapshot) => {
      setAuthorities(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Authority)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'authorities');
    });

    // Load template labels
    const loadTemplate = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'templates', procedure.type));
        if (docSnap.exists()) {
          const fields = docSnap.data().fields as any[];
          const mapping: Record<string, string> = {};
          fields.forEach(f => mapping[f.fieldId] = f.label);
          setTemplateLabels(mapping);
        }
      } catch (err) {
        console.error('Error loading template labels:', err);
      }
    };
    loadTemplate();

    // Load student profile
    const loadStudent = async () => {
      try {
        const studentDocRef = doc(db, 'users', procedure.studentId);
        const docSnap = await getDoc(studentDocRef).catch(err => {
          handleFirestoreError(err, OperationType.GET, `users/${procedure.studentId}`);
          throw err;
        });
        if (docSnap.exists()) setStudent(docSnap.data());
      } catch (err) {
        console.error('Error loading student profile:', err);
      }
    };
    loadStudent();
    
    // Auto-update to "in_review" if admin opens a "pending" procedure
    if (profile?.role === 'admin' && procedure.status === 'pending') {
      const updateRef = async () => {
        try {
          await updateDoc(doc(db, 'procedures', procedure.id), {
            status: 'in_review',
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error('Error auto-updating to in_review:', err);
        }
      };
      updateRef();
    }

    return () => unsubscribe();
  }, [procedure, profile]);

  const handleDownloadPDF = () => {
    if (!student) return;
    const auth = selectedAuthority ? authorities.find(a => a.id === selectedAuthority) : undefined;
    generateProcedurePDF(
      procedure.type,
      procedure.data,
      student,
      procedure.submissionMethod === 'digital',
      auth,
      templateLabels
    );
  };

  const handleUpdateStatus = async (status: 'approved' | 'rejected', reason?: string) => {
    setLoading(true);
    try {
      const updateData: any = {
        status,
        authorityId: selectedAuthority || null,
        updatedAt: new Date().toISOString()
      };
      
      if (status === 'rejected' && reason) {
        updateData.rejectionReason = reason;
      }

      await updateDoc(doc(db, 'procedures', procedure.id), updateData);
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `procedures/${procedure.id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'procedures', procedure.id));
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `procedures/${procedure.id}`);
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-bg-base rounded-lg text-accent-blue">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-text-main">Detalles del Expediente</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">#{procedure.caseNumber}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-bg-base rounded-full transition-colors">
          <X className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Student Info */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-text-muted">Información del Alumno</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-bg-base rounded-full flex items-center justify-center text-text-muted">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-main">{student?.fullName || 'Cargando...'}</p>
                <p className="text-[12px] text-text-muted">DNI {student?.dni}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-text-muted">Detalles del Trámite</h4>
            <div>
              <p className="text-sm font-bold text-text-main">{PROCEDURE_LABELS[procedure.type]}</p>
              <p className="text-[12px] text-text-muted">Iniciado el {format(new Date(procedure.createdAt), "d 'de' MMMM, yyyy", { locale: es })}</p>
            </div>
          </div>
        </div>

        {/* Form Data */}
        <div className="space-y-4">
          <h4 className="text-[11px] uppercase tracking-widest font-bold text-text-muted">Datos Declarados</h4>
          <div className="bg-bg-base/50 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 border border-border-subtle shadow-sm">
            {Object.entries(procedure.data).map(([key, value]) => {
              if (key === 'submissionMethod') return null;
              let label = templateLabels[key] || key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1');
              
              if (procedure.type === 'alumno_regular' && (label.toLowerCase().includes('día') || label.toLowerCase().includes('dia'))) {
                label = 'CURSA';
              }

              if (key === 'subjectPairs' && Array.isArray(value)) {
                return (
                  <div key={key} className="col-span-full space-y-3 bg-white p-4 rounded-lg border border-border-subtle shadow-inner">
                    <p className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Materias para Reconocimiento de Equivalencia</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border-subtle text-left">
                            <th className="py-2 px-2 font-bold text-text-muted text-[11px] uppercase">Asignatura Origen</th>
                            <th className="py-2 px-2 font-bold text-text-muted text-[11px] uppercase">Asignatura IFTS 18</th>
                          </tr>
                        </thead>
                        <tbody>
                          {value.map((pair: any, i: number) => (
                            <tr key={i} className="border-b border-bg-base last:border-0 hover:bg-bg-base/30 transition-colors">
                              <td className="py-2 px-2 text-text-main">{pair.origin}</td>
                              <td className="py-2 px-2 text-text-main font-bold">{pair.local}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                return (
                  <div key={key} className="col-span-full space-y-3 bg-white p-4 rounded-lg border border-border-subtle shadow-inner">
                    <p className="text-[10px] uppercase text-text-muted font-bold tracking-wider">{label}</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle text-left">
                          <th className="py-2 font-bold text-text-muted text-[11px] uppercase">Día</th>
                          <th className="py-2 font-bold text-text-muted text-[11px] uppercase">Franja Horaria</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(value).map(([day, time]) => (
                          <tr key={day} className="border-b border-bg-base last:border-0 hover:bg-bg-base/30 transition-colors">
                            <td className="py-2 font-bold text-text-main">{String(day)}</td>
                            <td className="py-2 text-text-main">{String(time)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              let displayValue = String(value);
              
              // Format ISO dates (YYYY-MM-DD) to DD/MM/YYYY
              if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                const [year, month, day] = value.split('-');
                displayValue = `${day}/${month}/${year}`;
              }

              if (Array.isArray(value)) displayValue = value.join(', ');
              
              return (
                <div key={key} className="space-y-1">
                  <p className="text-[10px] uppercase text-text-muted font-bold tracking-wider">{label}</p>
                  <p className="text-[15px] font-semibold text-text-main leading-snug">
                    {displayValue}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rejection Reason (If applicable) */}
        {procedure.status === 'rejected' && procedure.rejectionReason && (
          <div className="space-y-3 bg-red-50 p-6 rounded-xl border border-red-100">
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-red-600">Motivo del Rechazo</h4>
            <p className="text-sm text-red-700 italic">"{procedure.rejectionReason}"</p>
          </div>
        )}

        {/* Digital Signature Management */}
        {profile?.role === 'admin' && procedure.status !== 'approved' && procedure.status !== 'rejected' && (
          <div className="space-y-4 pt-4 border-t border-border-subtle">
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-text-muted flex items-center gap-2">
              <Fingerprint className="w-4 h-4" />
              Gestión de Firma Digital
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-text-main mb-2">Autoridad que autoriza</label>
                <select 
                  value={selectedAuthority}
                  onChange={(e) => setSelectedAuthority(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-border-subtle rounded-lg text-sm focus:ring-1 focus:ring-accent-blue outline-none"
                >
                  <option value="">Seleccionar autoridad...</option>
                  {authorities.map(auth => (
                    <option key={auth.id} value={auth.id}>{auth.name} - {auth.position}</option>
                  ))}
                </select>
                <p className="text-[10px] text-text-muted mt-2">
                  La firma seleccionada aparecerá en el PDF final una vez que el expediente sea marcado como "Aprobado".
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showRejectionForm && (
        <div className="p-6 border-t border-border-subtle bg-red-50/50 space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-red-600 uppercase mb-2">Motivo del Rechazo</label>
            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="Explique al estudiante por qué se rechaza la solicitud..."
              className="w-full px-4 py-3 bg-white border border-red-200 rounded-xl text-sm min-h-[100px] outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleUpdateStatus('rejected', rejectionReasonInput)}
              disabled={loading || !rejectionReasonInput.trim()}
              className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
              Confirmar Rechazo
            </button>
            <button
              onClick={() => setShowRejectionForm(false)}
              disabled={loading}
              className="px-6 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="p-6 border-t border-border-subtle bg-bg-base/30 flex gap-4">
        {profile?.role === 'admin' ? (
          (procedure.status === 'pending' || procedure.status === 'in_review') ? (
            !showRejectionForm && (
              <>
                <button
                  onClick={() => setShowRejectionForm(true)}
                  disabled={loading}
                  className="flex-1 py-3 px-4 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Rechazar
                </button>
                <button
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={loading || !selectedAuthority}
                  className="flex-[2] py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Aprobar y Firmar
                </button>
              </>
            )
          ) : (
            <div className="w-full flex flex-col gap-4">
              <div className="w-full p-4 rounded-xl border border-border-subtle bg-white flex items-center justify-center gap-3">
                 <div className={procedure.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}>
                    {procedure.status === 'approved' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                 </div>
                 <p className="font-bold text-text-main">
                    Expediente {procedure.status === 'approved' ? 'Finalizado' : 'Rechazado'}
                 </p>
              </div>
            </div>
          )
        ) : (
          <div className="w-full flex flex-col gap-4">
            {procedure.status === 'pending' && (
              <div className="flex gap-2">
                {confirmDelete ? (
                  <>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      Confirmar Eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={loading}
                      className="px-6 py-3 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Eliminar Solicitud
                  </button>
                )}
              </div>
            )}
            
            <div className="w-full p-4 rounded-xl border border-border-subtle bg-white flex items-center justify-center gap-3">
               <div className={procedure.status === 'approved' ? 'text-emerald-600' : (procedure.status === 'rejected' ? 'text-red-600' : 'text-amber-500')}>
                  {procedure.status === 'approved' ? <CheckCircle className="w-6 h-6" /> : (procedure.status === 'rejected' ? <XCircle className="w-6 h-6" /> : <Clock className="w-5 h-5" />)}
               </div>
               <p className="font-bold text-text-main">
                  Estado: {procedure.status === 'approved' ? 'Aprobado' : (procedure.status === 'rejected' ? 'Rechazado' : (procedure.status === 'in_review' ? 'En Revisión' : 'Pendiente'))}
               </p>
            </div>
            
            {procedure.status === 'approved' && (
              <button
                onClick={handleDownloadPDF}
                className="w-full py-3 bg-primary-brand text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-5 h-5" />
                Descargar Documento Firmado
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
