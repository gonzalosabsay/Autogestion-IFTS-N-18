import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, ProcedureRequest, PROCEDURE_LABELS } from '../types';
import { Plus, FileText, Clock, CheckCircle, XCircle, ChevronRight, Search, Settings } from 'lucide-react';
import ProcedureWizard from './Procedures/ProcedureWizard';
import ProcedureDetails from './Procedures/ProcedureDetails';
import AuthorityManager from './Admin/AuthorityManager';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import AcademicPlan from './AcademicPlan';
import AcademicChatbot from './AcademicChatbot';

interface DashboardProps {
  profile: UserProfile | null;
  activeNav?: 'procedures' | 'authorities' | 'wizard' | 'academic_plan';
  onNavChange?: (nav: 'procedures' | 'authorities' | 'wizard' | 'academic_plan') => void;
}

export default function Dashboard({ profile, activeNav, onNavChange }: DashboardProps) {
  const [procedures, setProcedures] = useState<ProcedureRequest[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureRequest | null>(null);
  const [filter, setFilter] = useState('');

  // Sincronizar activeNav con estados internos
  useEffect(() => {
    if (activeNav === 'wizard') {
      setShowWizard(true);
      // Reset navigation after opening wizard to avoid infinite loop
      onNavChange?.('procedures');
    }
  }, [activeNav, onNavChange]);

  const activeTab = (activeNav === 'authorities' || activeNav === 'procedures' || activeNav === 'academic_plan') 
    ? activeNav 
    : 'procedures';

  useEffect(() => {
    if (!profile) return;

    const isSuperAdmin = profile.email === 'gonzalo.sabsay@gmail.com' || profile.email === 'gonzalosabsay@ifts18.edu.ar';

    const q = profile.role === 'admin'
      ? (isSuperAdmin 
          ? query(collection(db, 'procedures'), orderBy('createdAt', 'desc'))
          : query(
              collection(db, 'procedures'), 
              where('assignedAdminId', '==', profile.uid),
              orderBy('createdAt', 'desc')
            )
        )
      : query(
          collection(db, 'procedures'),
          where('studentId', '==', profile.uid),
          orderBy('createdAt', 'desc')
        );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcedureRequest));
      setProcedures(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'procedures');
    });

    return () => unsubscribe();
  }, [profile]);

  const filteredProcedures = procedures.filter(p => 
    p.caseNumber.toLowerCase().includes(filter.toLowerCase()) ||
    PROCEDURE_LABELS[p.type].toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'in_review': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'approved': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_review': return 'En Revisión';
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[24px] sm:text-[32px] font-bold tracking-[-0.03em] text-text-main leading-tight mb-2">
            {activeTab === 'academic_plan' 
              ? 'Plan de Estudios TSAS' 
              : (profile?.role === 'admin' ? 'Panel de Administración' : 'Tramitación de Constancias')}
          </h1>
          <p className="text-[14px] sm:text-[16px] text-text-muted">
            {activeTab === 'academic_plan'
              ? 'Consulta las materias, requisitos y docentes de tu carrera.'
              : (profile?.role === 'admin' 
                ? 'Gestiona expedientes y firmas autorizadas del sistema.' 
                : 'Completa los campos para iniciar tu expediente administrativo.')}
          </p>
        </div>

        {profile?.role === 'admin' && (
          <div className="flex bg-sidebar-bg p-1 border border-border-subtle rounded-xl shadow-sm overflow-x-auto whitespace-nowrap">
            <button 
              onClick={() => onNavChange?.('procedures')}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all focus:outline-none",
                activeTab === 'procedures' ? "bg-bg-base text-text-main shadow-sm" : "text-text-muted hover:text-text-main"
              )}
            >
              Expedientes
            </button>
            <button 
              onClick={() => onNavChange?.('authorities')}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all focus:outline-none",
                activeTab === 'authorities' ? "bg-bg-base text-text-main shadow-sm" : "text-text-muted hover:text-text-main"
              )}
            >
              Firmas
            </button>
          </div>
        )}
      </header>

      {activeTab === 'authorities' && profile?.role === 'admin' ? (
        <AuthorityManager />
      ) : activeTab === 'academic_plan' && profile?.role === 'student' && profile?.career === 'TSAS' ? (
        <>
          <AcademicPlan />
          <AcademicChatbot />
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Panel */}
          <div className="space-y-8">
            {profile?.role === 'student' && (
              <div className="card-minimal">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="section-title mb-0">Iniciar Nueva Solicitud</h2>
                  <button
                    onClick={() => setShowWizard(true)}
                    className="btn-minimal-primary"
                  >
                    Comenzar Trámite
                  </button>
                </div>
                
                <div className="p-8 border-2 border-dashed border-border-subtle rounded-2xl bg-bg-base/50 text-center space-y-4 group hover:border-accent-blue transition-colors cursor-pointer" onClick={() => setShowWizard(true)}>
                  <div className="w-16 h-16 bg-sidebar-bg rounded-full flex items-center justify-center mx-auto shadow-sm border border-border-subtle group-hover:text-accent-blue">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold">Seleccionar tipo de trámite</p>
                    <p className="text-[12px] text-text-muted">Inicia tu expediente en pocos pasos</p>
                  </div>
                </div>
              </div>
            )}

            <div className="card-minimal overflow-hidden !p-0">
              <div className="p-4 sm:p-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="section-title mb-0">
                  {profile?.role === 'admin' ? 'Todos los Expedientes' : 'Expedientes Recientes'}
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Buscar expediente..." 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-bg-base border border-border-subtle rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent-blue"
                  />
                </div>
              </div>

              <div className="divide-y divide-border-subtle">
                {filteredProcedures.length > 0 ? (
                  filteredProcedures.map((proc) => (
                    <motion.div 
                      layout
                      key={proc.id} 
                      onClick={() => setSelectedProcedure(proc)}
                      className="p-4 sm:p-5 hover:bg-bg-base transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-bg-base rounded-lg flex items-center justify-center text-text-muted group-hover:text-accent-blue transition-colors shrink-0">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] sm:text-[14px] font-semibold text-text-main truncate">{PROCEDURE_LABELS[proc.type]}</div>
                          <div className="text-[11px] sm:text-[12px] text-text-muted">
                             {format(new Date(proc.createdAt), "d MMM yyyy", { locale: es })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-6 ml-4">
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] sm:text-[13px] font-mono font-bold text-accent-blue">#{proc.caseNumber.split('-').pop()}</span>
                          <div className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded mt-1",
                            proc.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                            proc.status === 'rejected' ? "bg-red-100 text-red-700" :
                            "bg-border-subtle text-text-muted"
                          )}>
                            {getStatusLabel(proc.status)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-border-subtle group-hover:text-text-main transition-colors" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-20 text-center">
                    <p className="text-text-muted text-sm">No se registran trámites todavía.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <div className="card-minimal bg-[#EFF6FF] dark:bg-blue-500/10 !border-[#BFDBFE] dark:!border-blue-500/20">
               <h2 className="section-title text-[#1E40AF] dark:text-blue-400">Información Útil</h2>
               <p className="text-[12px] leading-[1.6] text-[#1E40AF] dark:text-blue-300">
                  {profile?.role === 'admin' 
                    ? 'Como administrador puedes supervisar todos los expedientes y gestionar las firmas autorizadas del sistema.'
                    : 'Los trámites de constancias regulares se procesan en un máximo de 48hs hábiles. Podrás descargar el PDF firmado digitalmente desde la sección "Mis Expedientes".'}
               </p>
            </div>

            <div className="card-minimal">
              <h2 className="section-title">Resumen de Cuenta</h2>
              <div className="space-y-4">
                {[
                  { label: 'Pendientes', value: procedures.filter(p => p.status === 'pending').length },
                  { label: 'Aprobados', value: procedures.filter(p => p.status === 'approved').length },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border-subtle pb-4 last:border-0 last:pb-0">
                    <span className="text-[13px] text-text-muted">{stat.label}</span>
                    <span className="text-[18px] font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 bg-text-main/20 backdrop-blur-[2px] z-[100] flex items-center justify-center sm:p-4">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 20 }}
              className="bg-sidebar-bg w-full h-[100dvh] sm:h-auto sm:max-w-2xl sm:rounded-2xl shadow-2xl border border-border-subtle overflow-hidden sm:max-h-[90vh] flex flex-col"
            >
              <ProcedureWizard profile={profile} onClose={() => setShowWizard(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedProcedure && (
          <div className="fixed inset-0 bg-text-main/20 backdrop-blur-[2px] z-[100] flex items-center justify-center sm:p-4">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-sidebar-bg w-full h-[100dvh] sm:h-full sm:max-w-2xl sm:ml-auto sm:rounded-l-2xl shadow-2xl border-l border-border-subtle overflow-hidden flex flex-col pt-safe"
            >
              <ProcedureDetails 
                procedure={selectedProcedure} 
                profile={profile}
                onClose={() => setSelectedProcedure(null)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

}
