import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ProcedureType, PROCEDURE_LABELS, TemplateField } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { extractFieldsFromTemplate } from '../../lib/gemini';
import { Upload, Loader2, Check, AlertCircle, FileText, Save } from 'lucide-react';

export default function TemplateManager() {
  const [selectedType, setSelectedType] = useState<ProcedureType>('alumno_regular');
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [selectedType]);

  const loadTemplate = async () => {
    setLoading(true);
    setFields([]);
    try {
      const path = `templates/${selectedType}`;
      const docRef = doc(db, 'templates', selectedType);
      const docSnap = await getDoc(docRef).catch(err => {
         handleFirestoreError(err, OperationType.GET, path);
         throw err;
      });
      if (docSnap.exists()) {
        setFields(docSnap.data().fields);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extractedFields = await extractFieldsFromTemplate(base64, file.type);
        setFields(extractedFields);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error al analizar la plantilla. Intente con otro archivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const path = `templates/${selectedType}`;
      await setDoc(doc(db, 'templates', selectedType), {
        id: selectedType,
        fields,
        updatedAt: new Date().toISOString()
      }).catch(err => {
         handleFirestoreError(err, OperationType.WRITE, path);
         throw err;
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar la plantilla.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Plantillas</h2>
        <p className="text-text-muted text-sm">Configura los campos requeridos para cada tipo de trámite.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
        <div className="space-y-4">
          <label className="section-title">Tipo de Trámite</label>
          <div className="space-y-2">
            {(Object.entries(PROCEDURE_LABELS) as [ProcedureType, string][]).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`w-full p-4 rounded-xl text-left border-2 transition-all ${
                  selectedType === type 
                    ? 'border-accent-blue bg-accent-blue/5 text-accent-blue' 
                    : 'border-border-subtle bg-sidebar-bg hover:border-text-muted text-text-main'
                }`}
              >
                <div className="font-semibold text-sm">{label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card-minimal space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="font-bold">Configuración de Campos</h3>
            <div className="flex flex-wrap items-center gap-2">
              <label className="btn-minimal-secondary cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Subir PDF/Imagen
                <input type="file" className="hidden" onChange={handleUpload} accept="application/pdf,image/*" />
              </label>
              <button 
                onClick={handleSave}
                disabled={loading || fields.length === 0}
                className="btn-minimal-primary flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Cambios
              </button>
            </div>
          </div>

          {loading && fields.length === 0 ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent-blue mb-4" />
              <p className="text-text-muted text-sm">Cargando definición de campos...</p>
            </div>
          ) : fields.length > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-3 text-sm">
                <Check className="w-4 h-4" />
                Se han identificado {fields.length} campos en la plantilla.
              </div>
              <div className="divide-y divide-border-subtle border border-border-subtle rounded-xl overflow-hidden">
                {fields.map((field, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between bg-sidebar-bg text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-bg-base rounded flex items-center justify-center text-text-muted">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">{field.label}</div>
                        <div className="text-[10px] text-text-muted uppercase tracking-wider">{field.type}</div>
                      </div>
                    </div>
                    {field.required && (
                      <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold uppercase">Requerido</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-border-subtle rounded-2xl bg-bg-base/30">
              <FileText className="w-12 h-12 mx-auto text-border-subtle mb-4" />
              <p className="text-text-muted text-sm max-w-xs mx-auto">
                No hay campos definidos para este trámite. Suba una plantilla para que el sistema los extraiga automáticamente.
              </p>
            </div>
          )}

          {error && <div className="text-red-600 text-xs text-center">{error}</div>}
          {success && <div className="text-emerald-600 text-xs text-center font-bold">¡Plantilla guardada con éxito!</div>}
        </div>
      </div>
    </div>
  );
}
