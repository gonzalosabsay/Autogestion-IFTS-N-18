import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, ProcedureType, PROCEDURE_LABELS, TemplateField, SubmissionMethod } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { generateCaseNumber } from '../../lib/utils';
import { extractFieldsFromTemplate, autoFillFields } from '../../lib/gemini';
import { generateProcedurePDF } from '../../lib/pdf';
import { X, ArrowRight, ArrowLeft, Upload, FileText, Check, Loader2, AlertCircle, Printer, Fingerprint, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface WizardProps {
  profile: UserProfile | null;
  onClose: () => void;
}

export default function ProcedureWizard({ profile, onClose }: WizardProps) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ProcedureType | null>(null);
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [equivalencyPairs, setEquivalencyPairs] = useState<{ origin: string; local: string }[]>([{ origin: '', local: '' }]);

  const steps = [
    { title: 'Seleccionar Trámite', icon: <FileText className="w-5 h-5" /> },
    { title: 'Método de Firma', icon: <Fingerprint className="w-5 h-5" /> },
    { title: 'Cargar Plantilla', icon: <Upload className="w-5 h-5" /> },
    { title: 'Completar Datos', icon: <ArrowRight className="w-5 h-5" /> },
    { title: 'Confirmación', icon: <Check className="w-5 h-5" /> },
  ];

  const isPhysicalOnly = type === 'examen' || type === 'equivalencias';
  const isDigitalOnly = type === 'pase' || type === 'readmision' || type === 'cambio_carrera';

  const handleTypeSelect = async (t: ProcedureType) => {
    setType(t);
    
    // For digital-only procedures, skip method selection and go straight to Step 4 after setting fields
    if (t === 'pase' || t === 'readmision' || t === 'cambio_carrera') {
      setSubmissionMethod('digital');
      
      let fields: TemplateField[] = [];
      
      if (t === 'pase') {
        fields = [
          { fieldId: 'nombre', label: 'Nombre', type: 'text', required: true },
          { fieldId: 'apellido', label: 'Apellido', type: 'text', required: true },
          { fieldId: 'email', label: 'Mail', type: 'text', required: true },
          { fieldId: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date', required: true },
          { fieldId: 'dni', label: 'DNI', type: 'text', required: true },
          { fieldId: 'institucion_origen', label: 'Institución de Origen', type: 'text', required: true },
          { fieldId: 'institucion_destino', label: 'Institución Destino', type: 'text', required: true },
        ];
        
        if (profile) {
          setFormData({
            nombre: profile.fullName.split(' ').slice(0, -1).join(' '),
            apellido: profile.fullName.split(' ').slice(-1)[0],
            email: profile.email,
            fecha_nacimiento: profile.birthDate || '',
            dni: profile.dni,
            institucion_origen: 'IFTS 18',
            institucion_destino: '',
          });
        }
      } else if (t === 'readmision') {
        fields = [
          { fieldId: 'carrera_solicitada', label: 'Carrera para Readmisión', type: 'text', required: true },
          { fieldId: 'apellido', label: 'Apellidos', type: 'text', required: true },
          { fieldId: 'nombre', label: 'Nombres', type: 'text', required: true },
          { fieldId: 'dni', label: 'D.N.I.', type: 'text', required: true },
          { fieldId: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date', required: true },
          { fieldId: 'domicilio', label: 'Domicilio', type: 'text', required: true },
          { fieldId: 'localidad', label: 'Localidad y Código Postal', type: 'text', required: true },
          { fieldId: 'telefono', label: 'Teléfono', type: 'text', required: true },
          { fieldId: 'email', label: 'e-mail', type: 'text', required: true },
          { fieldId: 'anio_ingreso', label: 'Año de ingreso', type: 'text', required: true },
          { fieldId: 'rematriculaciones', label: 'Rematriculaciones Anteriores', type: 'text', required: false },
          { fieldId: 'motivo_readmision', label: 'Motivo de Readmisión', type: 'select', required: true },
        ];
        
        if (profile) {
          setFormData({
            carrera_solicitada: profile.career,
            apellido: profile.fullName.split(' ').slice(-1)[0],
            nombre: profile.fullName.split(' ').slice(0, -1).join(' '),
            dni: profile.dni,
            email: profile.email,
          });
        }
      } else if (t === 'cambio_carrera') {
        fields = [
          { fieldId: 'nombre', label: 'Nombre', type: 'text', required: true },
          { fieldId: 'apellido', label: 'Apellido', type: 'text', required: true },
          { fieldId: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date', required: true },
          { fieldId: 'email', label: 'mail', type: 'text', required: true },
          { fieldId: 'carrera_elegida', label: 'Carrera elegida', type: 'text', required: true },
        ];

        if (profile) {
          setFormData({
            nombre: profile.fullName.split(' ').slice(0, -1).join(' '),
            apellido: profile.fullName.split(' ').slice(-1)[0],
            fecha_nacimiento: profile.birthDate || '',
            email: profile.email,
            carrera_elegida: '',
          });
        }
      }

      setTemplateFields(fields);
      setStep(4);
      return;
    }

    setStep(2);
  };

  const handleMethodSelect = async (m: SubmissionMethod) => {
    setSubmissionMethod(m);
    setLoading(true);
    const t = type!;
    try {
      // Check if template exists in Firestore
      const path = `templates/${t}`;
      const docRef = doc(db, 'templates', t);
      const docSnap = await getDoc(docRef).catch(err => {
        handleFirestoreError(err, OperationType.GET, path);
        throw err;
      });
      
      if (docSnap.exists()) {
        const savedFields = docSnap.data().fields as TemplateField[];
        setTemplateFields(savedFields);
        
        // Auto-fill logic using basic mapping if no PDF is being analyzed
        if (profile) {
          const initialData: Record<string, any> = {};
          savedFields.forEach(f => {
             // Simple heuristic autofill for common fields
             const label = f.label.toLowerCase();
             if (label.includes('nombre') || label.includes('completo')) initialData[f.fieldId] = profile.fullName;
             if (label.includes('dni')) initialData[f.fieldId] = profile.dni;
             if (label.includes('carrera')) initialData[f.fieldId] = profile.career;
             if (label.includes('email') || label.includes('correo')) initialData[f.fieldId] = profile.email;
          });
          setFormData(initialData);
        }
        setStep(4); // Skip upload step if template is already loaded by admin
      } else {
        setStep(3); // Fallback to upload
      }
    } catch (err) {
      console.error(err);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadError('');
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const fields = await extractFieldsFromTemplate(base64, file.type);
        setTemplateFields(fields);
        
        // Try to auto-fill with student data
        if (profile) {
          const autoFilled = await autoFillFields(base64, file.type, profile);
          const initialData: Record<string, any> = {};
          autoFilled.mappings.forEach((m: any) => {
            initialData[m.fieldId] = m.value;
          });
          setFormData(initialData);
        }
        
        setStep(4);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError('Error al procesar la plantilla. Asegúrese de que sea una imagen o PDF legible.');
    } finally {
      setLoading(false);
    }
  };

  const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const TIME_RANGES = ["18:00 a 22:15", "18:00 a 20:00", "20:00 a 22:15"];

  // Auto-fill date fields with current date
  useEffect(() => {
    if (templateFields.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      let updated = false;
      const newFormData = { ...formData };
      
      templateFields.forEach(field => {
        const isDate = field.label.toLowerCase().includes('fecha');
        const isStudentSignClari = field.label.toLowerCase().includes('aclaración') && field.label.toLowerCase().includes('firma');
        
        if (isDate && !newFormData[field.fieldId]) {
          newFormData[field.fieldId] = today;
          updated = true;
        }
      });

      if (updated) {
        setFormData(newFormData);
      }
    }
  }, [templateFields]);

  const toggleDay = (fieldId: string, day: string) => {
    if (type === 'alumno_regular') {
      const currentSchedule = (formData[fieldId] as Record<string, string>) || {};
      if (currentSchedule[day]) {
        const newSchedule = { ...currentSchedule };
        delete newSchedule[day];
        setFormData({ ...formData, [fieldId]: newSchedule });
      } else {
        setFormData({ ...formData, [fieldId]: { ...currentSchedule, [day]: TIME_RANGES[0] } });
      }
      return;
    }
    const currentDays = (formData[fieldId] as string[]) || [];
    if (currentDays.includes(day)) {
      setFormData({ ...formData, [fieldId]: currentDays.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, [fieldId]: [...currentDays, day] });
    }
  };

  const updateTime = (fieldId: string, day: string, time: string) => {
    const currentSchedule = (formData[fieldId] as Record<string, string>) || {};
    setFormData({ ...formData, [fieldId]: { ...currentSchedule, [day]: time } });
  };

  const handleFinish = async () => {
    if (!profile || !type || !submissionMethod) return;

    let finalData = { ...formData };
    if (type === 'equivalencias') {
      finalData.subjectPairs = equivalencyPairs.filter(p => p.origin.trim() || p.local.trim());
    }

    if (submissionMethod === 'print') {
      generateProcedurePDF(type, finalData, profile, false);
      onClose();
      return;
    }

    setLoading(true);
    try {
      const path = 'procedures';
      
      // Randomly assign an administrator of the same career
      let assignedAdminId = null;
      try {
        const adminsQuery = query(
          collection(db, 'users'), 
          where('role', '==', 'admin'),
          where('career', '==', profile.career)
        );
        const adminSnapshots = await getDocs(adminsQuery);
        if (!adminSnapshots.empty) {
          const admins = adminSnapshots.docs.map(d => d.id);
          assignedAdminId = admins[Math.floor(Math.random() * admins.length)];
        }
      } catch (err) {
        console.error('Error assigning admin:', err);
      }

      const newProcedure = {
        studentId: profile.uid,
        type,
        status: 'pending',
        caseNumber: generateCaseNumber(),
        data: finalData,
        submissionMethod,
        assignedAdminId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await addDoc(collection(db, path), newProcedure).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, path);
        throw err;
      });
      setFormData({ ...formData, caseNumber: newProcedure.caseNumber });
      setStep(5);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-border-subtle bg-sidebar-bg flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-bg-base text-accent-blue p-2 rounded-lg border border-border-subtle shadow-sm">
            {steps[step - 1].icon}
          </div>
          <div>
            <h3 className="font-bold text-text-main">Nueva Solicitud</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Paso {step} de 5: {steps[step - 1].title}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-bg-base rounded-full transition-colors">
          <X className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-bg-base flex">
        <motion.div 
          className="h-full bg-accent-blue shadow-[0_0_10px_rgba(0,102,255,0.3)]"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-sidebar-bg transition-colors">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {(Object.keys(PROCEDURE_LABELS) as ProcedureType[]).map((t) => (
                <button
                  key={t}
                  disabled={loading}
                  onClick={() => handleTypeSelect(t)}
                  className="p-5 bg-sidebar-bg border border-border-subtle rounded-xl text-left hover:border-accent-blue hover:bg-bg-base transition-all group disabled:opacity-50"
                >
                  <div className="font-semibold text-[14px] text-text-main group-hover:text-accent-blue transition-colors">
                    {loading && type === t ? (
                      <div className="flex items-center gap-2">
                         <Loader2 className="w-4 h-4 animate-spin" />
                         Cargando...
                      </div>
                    ) : PROCEDURE_LABELS[t]}
                  </div>
                  <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                    Presione para iniciar la carga de datos.
                  </p>
                </button>
              ))}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h4 className="text-xl font-bold tracking-tight">¿Cómo desea presentar el trámite?</h4>
                <p className="text-sm text-text-muted">Elija el método que mejor se adapte a su disponibilidad.</p>
              </div>

              {isPhysicalOnly && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Este trámite requiere <strong>firma manuscrita obligatoria</strong> según normativa institucional, por lo que únicamente se permite la presentación mediante impresión física.
                  </p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleMethodSelect('print')}
                  className={cn(
                    "p-8 bg-sidebar-bg border border-border-subtle rounded-2xl text-center hover:border-accent-blue hover:bg-bg-base transition-all group flex flex-col items-center gap-4",
                    isPhysicalOnly && "ring-2 ring-accent-blue border-accent-blue shadow-md"
                  )}
                >
                  <div className="w-12 h-12 bg-bg-base rounded-full flex items-center justify-center text-text-muted group-hover:text-accent-blue transition-colors">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-text-main">Impresión Física</p>
                    <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                      Se descargará el PDF completo para que lo imprima y lo acerque al IFTS para su firma. 
                      <strong> No genera expediente digital.</strong>
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => !isPhysicalOnly && handleMethodSelect('digital')}
                  disabled={isPhysicalOnly}
                  className={cn(
                    "p-8 bg-sidebar-bg border border-border-subtle rounded-2xl text-center hover:border-accent-blue hover:bg-bg-base transition-all group flex flex-col items-center gap-4",
                    isPhysicalOnly && "opacity-50 grayscale cursor-not-allowed grayscale-[0.5]"
                  )}
                >
                  <div className="w-12 h-12 bg-bg-base rounded-full flex items-center justify-center text-text-muted group-hover:text-accent-blue transition-colors">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-text-main">Firma Digital</p>
                    <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
                      Inicia un expediente digital. Las autoridades firmarán el PDF y podrá descargarlo una vez aprobado.
                      <strong> Proceso 100% online.</strong>
                    </p>
                    {isPhysicalOnly && (
                      <span className="inline-block mt-3 px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                        No disponible para este trámite
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h4 className="text-xl font-bold tracking-tight">Sube tu formulario</h4>
                <p className="text-sm text-text-muted">Extraeremos tus datos automáticamente para evitar errores.</p>
              </div>

              <div className="relative border-2 border-dashed border-border-subtle rounded-2xl p-12 text-center bg-bg-base transition-colors group">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-sidebar-bg rounded-lg flex items-center justify-center mx-auto shadow-sm border border-border-subtle group-hover:text-accent-blue">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <div className="text-text-muted text-[14px]">
                    {loading ? 'Analizando plantilla...' : <>Arrastra tu archivo aquí o <strong className="text-accent-blue">selecciona desde tu PC</strong></>}
                  </div>
                  <p className="text-[11px] text-text-muted opacity-60">Formatos soportados: PNG, JPG, PDF (Máx. 5MB)</p>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-100 italic text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{uploadError}</p>
                </div>
              )}

              <button 
                onClick={() => setStep(3)}
                className="w-full py-2 text-text-muted text-[12px] font-medium hover:text-text-main transition-colors uppercase tracking-widest"
              >
                O completar manualmente...
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#EFF6FF] p-4 rounded-xl border border-[#BFDBFE] flex gap-3">
                <FileText className="w-5 h-5 text-[#1E40AF] mt-0.5" />
                <p className="text-[12px] text-[#1E40AF] leading-relaxed">
                  {submissionMethod === 'digital' 
                    ? 'Verifica que la información sea correcta antes de generar el expediente digital.'
                    : 'Completa los datos para generar el PDF que deberás imprimir.'}
                </p>
              </div>

              <div className="space-y-6">
                {(() => {
                  const renderedFields = new Set<string>();
                  let dayFieldRendered = false;
                  let equivalencyRendered = false;

                  return templateFields.filter(f => {
                    const label = f.label.toLowerCase();
                    if (type === 'readmision') {
                      return true;
                    }
                    if (type === 'alumno_regular') {
                      const isDay = label.includes('día') || label.includes('dia');
                      const isAuth = label.includes('autoridad') || label.includes('presenta');
                      const isDate = label.includes('fecha');
                      return isDay || isAuth || isDate;
                    }
                    if (type === 'equivalencias') {
                      const isAcv = label.includes('aclaración') && label.includes('firma');
                      const isDate = label.includes('fecha');
                      const isOriginalList = label.includes('origen');
                      const isCurrentList = label.includes('actual');
                      // Skip clarity sign field and date field (handled automatically)
                      return !isAcv && !isDate;
                    }
                    return true;
                  }).map((field) => {
                    const label = field.label.toLowerCase();
                    const isDayField = label.includes('día') || label.includes('dia');
                    const isEquivalencyList = type === 'equivalencias' && (label.includes('origen') || label.includes('actual'));
                    
                    if (field.type === 'select' && type === 'readmision' && field.fieldId === 'motivo_readmision') {
                      const reasons = [
                        'Enfermedad o discapacidad',
                        'Prosecución de otros estudios universitarios o terciarios',
                        'Comisiones o viajes de estudios',
                        'Ausencia por traslado al interior o exterior del país',
                        'Embarazo',
                        'Otras causales de equivalente importancia que las anteriores'
                      ];
                      
                      return (
                        <div key={field.fieldId} className="space-y-3">
                          <label className="text-[11px] uppercase tracking-wider font-bold text-text-muted">{field.label}</label>
                          <div className="grid grid-cols-1 gap-2">
                            {reasons.map(reason => (
                              <button
                                key={reason}
                                type="button"
                                onClick={() => setFormData({ ...formData, [field.fieldId]: reason })}
                                className={cn(
                                  "text-left p-3 rounded-xl border text-sm transition-all flex items-start gap-3",
                                  formData[field.fieldId] === reason 
                                    ? "bg-accent-blue/5 border-accent-blue text-accent-blue ring-1 ring-accent-blue/20" 
                                    : "bg-sidebar-bg border-border-subtle text-text-muted hover:border-text-main"
                                )}
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0",
                                  formData[field.fieldId] === reason ? "border-accent-blue bg-accent-blue" : "border-text-muted"
                                )}>
                                  {formData[field.fieldId] === reason && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                                <span>{reason}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (type === 'alumno_regular' && isDayField) {
                      if (dayFieldRendered) return null;
                      dayFieldRendered = true;
                    }

                    if (type === 'equivalencias' && isEquivalencyList) {
                      if (equivalencyRendered) return null;
                      equivalencyRendered = true;
                      
                      return (
                        <div key="equivalency-section" className="space-y-4 p-6 bg-bg-base rounded-2xl border border-border-subtle">
                          <div className="flex items-center justify-between mb-2">
                             <h4 className="text-[14px] font-bold text-text-main">Equivalencias Solicitadas</h4>
                             <button 
                               type="button"
                               onClick={() => setEquivalencyPairs([...equivalencyPairs, { origin: '', local: '' }])}
                               className="p-1 px-3 bg-sidebar-bg border border-border-subtle rounded-lg text-xs font-bold text-accent-blue hover:bg-bg-base transition-colors flex items-center gap-1 shadow-sm"
                             >
                                <Plus className="w-3 h-3" /> Agregar Materia
                             </button>
                          </div>
                          <p className="text-[11px] text-text-muted mb-4 italic">Asocie cada materia aprobada con la materia del plan actual que desea reconocer.</p>
                          
                          <div className="space-y-3">
                            {equivalencyPairs.map((pair, idx) => (
                              <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase font-bold text-text-muted">Asignatura origen</label>
                                  <input 
                                    className="w-full px-3 py-2 text-sm bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none text-text-main"
                                    placeholder="Nombre materia origen..."
                                    value={pair.origin}
                                    onChange={(e) => {
                                      const newList = [...equivalencyPairs];
                                      newList[idx].origin = e.target.value;
                                      setEquivalencyPairs(newList);
                                    }}
                                  />
                                </div>
                                <div className="flex justify-center text-text-muted pt-4 hidden md:flex">
                                  <ArrowRight className="w-4 h-4" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase font-bold text-text-muted">Asignatura IFTS 18</label>
                                  <div className="flex gap-2">
                                    <input 
                                      className="flex-1 px-3 py-2 text-sm bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none text-text-main"
                                      placeholder="Nombre materia local..."
                                      value={pair.local}
                                      onChange={(e) => {
                                        const newList = [...equivalencyPairs];
                                        newList[idx].local = e.target.value;
                                        setEquivalencyPairs(newList);
                                      }}
                                    />
                                    {equivalencyPairs.length > 1 && (
                                      <button 
                                        onClick={() => setEquivalencyPairs(equivalencyPairs.filter((_, i) => i !== idx))}
                                        className="p-2 text-text-muted hover:text-red-500"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    const displayLabel = (type === 'alumno_regular' && isDayField) ? 'CURSA' : field.label;

                    return (
                      <div key={field.fieldId} className="space-y-2">
                        <label className="block text-[11px] uppercase tracking-wider font-bold text-text-muted">{displayLabel}</label>
                        
                        {isDayField ? (
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {DAYS_OF_WEEK.map(day => {
                                const isSelected = type === 'alumno_regular' 
                                  ? !!(formData[field.fieldId] || {})[day]
                                  : (formData[field.fieldId] || []).includes(day);
                                
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(field.fieldId, day)}
                                    className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all border ${
                                      isSelected
                                        ? 'bg-accent-blue text-white border-accent-blue shadow-md'
                                        : 'bg-bg-base text-text-muted border-border-subtle hover:border-accent-blue'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Time range selects for Alumno Regular - Dynamic per selected day */}
                            {type === 'alumno_regular' && Object.keys(formData[field.fieldId] || {}).length > 0 && (
                              <div className="space-y-2 p-3 bg-bg-base/50 rounded-xl border border-border-subtle animate-in fade-in slide-in-from-top-1">
                                {Object.entries(formData[field.fieldId] as Record<string, string>).map(([day, time]) => (
                                  <div key={day} className="flex items-center justify-between gap-3 py-1 border-b border-border-subtle/30 last:border-0">
                                    <span className="text-[11px] font-bold text-text-main w-16">{day}</span>
                                    <select
                                      value={time}
                                      onChange={(e) => updateTime(field.fieldId, day, e.target.value)}
                                      className="flex-1 px-2 py-1 bg-bg-base border border-border-subtle rounded text-[11px] outline-none focus:ring-1 focus:ring-accent-blue text-text-main"
                                    >
                                      {TIME_RANGES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <input 
                            type={field.type === 'date' ? 'date' : 'text'}
                            value={formData[field.fieldId] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.fieldId]: e.target.value })}
                            placeholder={`Ingrese ${field.label.toLowerCase()}`}
                            className="w-full px-4 py-2.5 bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none text-sm transition-all shadow-sm text-text-main"
                          />
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12 space-y-8"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <Check className="w-10 h-10" />
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-2xl font-bold tracking-tight text-text-main">Trámite Iniciado</h4>
                  <p className="text-text-muted mt-1">Su solicitud ha sido registrada en el sistema.</p>
                </div>
                
                <div className="p-8 border border-border-subtle rounded-2xl bg-sidebar-bg shadow-sm inline-block min-w-[300px]">
                  <div className="text-[10px] uppercase font-bold text-text-muted tracking-[0.2em] mb-3">Expediente Generado</div>
                  <div className="text-3xl font-mono font-bold text-accent-blue">
                    {formData.caseNumber || 'GENERANDO...'}
                  </div>
                </div>
              </div>
              <p className="text-[12px] text-text-muted max-w-xs mx-auto">
                Guarde este número para realizar el seguimiento en línea.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      {step < 5 && (
        <div className="p-6 border-t border-border-subtle bg-sidebar-bg flex justify-between gap-4 transition-colors">
          <button 
            onClick={() => setStep(Math.max(1, step - 1))}
            className="px-6 py-2.5 flex items-center gap-2 text-text-muted hover:text-text-main text-[14px] font-semibold transition-colors disabled:opacity-30"
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </button>
          
          {step === 4 ? (
            <button 
              onClick={handleFinish}
              disabled={loading}
              className="bg-primary-brand text-bg-base px-8 py-2.5 rounded-lg text-[14px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (submissionMethod === 'digital' ? <Check className="w-4 h-4" /> : <Printer className="w-4 h-4" />)}
              {submissionMethod === 'digital' ? 'Generar y Enviar' : 'Imprimir Formulario'}
            </button>
          ) : step === 3 && (
             <button 
              onClick={() => setStep(4)}
              className="px-8 py-2.5 flex items-center gap-2 text-text-main text-[14px] font-semibold border border-border-subtle rounded-lg hover:bg-bg-base transition-all"
            >
              Continuar manualmente
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      {step === 5 && (
        <div className="p-6 border-t border-border-subtle bg-sidebar-bg transition-colors">
          <button 
            onClick={onClose}
            className="w-full bg-sidebar-bg hover:bg-bg-base text-text-main py-3 rounded-xl font-semibold transition-colors shadow-lg border border-border-subtle"
          >
            Volver al Panel
          </button>
        </div>
      )}
    </>
  );
}
