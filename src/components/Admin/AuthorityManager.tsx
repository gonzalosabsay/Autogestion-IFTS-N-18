import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Authority } from '../../types';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { Save, Trash2, Plus, UserCheck, Loader2, AlertCircle, Fingerprint } from 'lucide-react';

export default function AuthorityManager() {
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const q = collection(db, 'authorities');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Authority));
      setAuthorities(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'authorities');
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200000) { // Keep it small
        setError('La imagen es muy pesada. Use una imagen de menos de 200KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !position) return;

    setLoading(true);
    setError('');
    try {
      const path = 'authorities';
      await addDoc(collection(db, path), {
        name,
        position,
        signatureUrl: signatureUrl || null,
        updatedAt: new Date().toISOString()
      }).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, path);
        throw err;
      });
      setName('');
      setPosition('');
      setSignatureUrl('');
    } catch (err) {
      setError('Error al agregar autoridad. Verifique sus permisos de administrador.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'authorities', id));
      setConfirmDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `authorities/${id}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
      <div className="card-minimal">
        <h2 className="section-title flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-accent-blue" />
          Nueva Autoridad Firmante
        </h2>
        <form onSubmit={handleAdd} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-text-muted mb-1.5">Nombre y Apellido</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Lic. Juan Pérez"
                className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-bold text-text-muted mb-1.5">Cargo / Función</label>
              <input 
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Ej: Rector IFTS N°18"
                className="w-full px-4 py-2 bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none text-sm"
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-bg-base/50 rounded-xl border border-dashed border-border-subtle">
             <div className="flex-1 space-y-1">
                <p className="text-[12px] font-bold text-text-main">Firma de Puño y Letra (Opcional)</p>
                <p className="text-[10px] text-text-muted">Suba una imagen PNG/JPG de fondo blanco o transparente.</p>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden" 
                  id="signature-upload"
                />
                <button 
                  type="button"
                  onClick={() => document.getElementById('signature-upload')?.click()}
                  className="mt-2 text-[11px] font-bold text-accent-blue hover:underline"
                >
                   {signatureUrl ? 'Cambiar imagen' : 'Seleccionar archivo'}
                </button>
             </div>
             {signatureUrl && (
               <div className="w-24 h-12 bg-white rounded border border-border-subtle overflow-hidden flex items-center justify-center p-1">
                  <img src={signatureUrl} alt="Vista previa" className="max-w-full max-h-full object-contain" />
               </div>
             )}
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-minimal-primary h-[38px] flex items-center gap-2 px-8"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Registrar Autoridad
            </button>
          </div>
        </form>
        {error && <p className="text-red-600 text-[11px] mt-2 font-medium">{error}</p>}
      </div>

      <div className="card-minimal overflow-hidden !p-0">
        <div className="p-6 border-b border-border-subtle">
           <h2 className="section-title mb-0">Autoridades registradas</h2>
        </div>
        <div className="divide-y divide-border-subtle">
          {authorities.length > 0 ? authorities.map((auth) => (
            <div key={auth.id} className="p-5 flex items-center justify-between group hover:bg-bg-base transition-colors">
              <div className="flex items-center gap-4">
                {auth.signatureUrl ? (
                  <div className="w-10 h-10 bg-white rounded border border-border-subtle flex items-center justify-center p-1">
                    <img src={auth.signatureUrl} alt="Firma" className="max-w-full max-h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-bg-base rounded flex items-center justify-center text-text-muted">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-text-main">{auth.name}</p>
                  <p className="text-[12px] text-text-muted">{auth.position}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {confirmDelete === auth.id ? (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleDelete(auth.id)}
                      className="text-[10px] bg-red-600 text-white px-2 py-1 rounded font-bold hover:bg-red-700 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button 
                      onClick={() => setConfirmDelete(null)}
                      className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold hover:bg-slate-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmDelete(auth.id)}
                    className="p-2 text-text-muted hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )) : (
            <div className="p-10 text-center text-text-muted text-sm italic">
              No hay autoridades registradas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
