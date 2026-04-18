import React, { useState, useEffect } from 'react';
import { TSAS_PLAN, Subject } from '../constants/academic-plan';
import { Book, Info, ArrowLeft, Layers, Clock, Calendar, Video, Globe, ExternalLink, MapPin, ChevronRight, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { PRESENCIAL_CALENDAR, getCuatrimestreFromCode } from '../constants/presencial-calendar';

export default function AcademicPlan() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Helper to get all recursive ancestors (prerequisites)
  const getAllAncestors = (code: string, visited = new Set<string>()): string[] => {
    const subject = TSAS_PLAN.find(s => s.code === code);
    if (!subject || visited.has(code)) return [];
    visited.add(code);
    
    let ancestors = [...subject.correlatives];
    subject.correlatives.forEach(corrCode => {
      ancestors = [...ancestors, ...getAllAncestors(corrCode, visited)];
    });
    return Array.from(new Set(ancestors));
  };

  // Helper to get all recursive descendants (dependent subjects)
  const getAllDescendants = (code: string, visited = new Set<string>()): string[] => {
    if (visited.has(code)) return [];
    visited.add(code);
    
    const dependents = TSAS_PLAN.filter(s => s.correlatives.includes(code)).map(s => s.code);
    let allDeps = [...dependents];
    dependents.forEach(depCode => {
      allDeps = [...allDeps, ...getAllDescendants(depCode, visited)];
    });
    return Array.from(new Set(allDeps));
  };

  const ancestors = selectedSubject ? getAllAncestors(selectedSubject.code) : [];
  const descendants = selectedSubject ? getAllDescendants(selectedSubject.code) : [];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-minimize on mobile selection to show the map briefly or just allow easier interaction
  useEffect(() => {
    if (selectedSubject) {
      setIsMinimized(false);
    }
  }, [selectedSubject]);

  const subjectsByYear = TSAS_PLAN.reduce((acc, subject) => {
    if (!acc[subject.year]) acc[subject.year] = [];
    acc[subject.year].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

  const getSubjectName = (code: string) => TSAS_PLAN.find(s => s.code === code)?.name || code;

  const ensureUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://${url}`;
  };

  const attendanceWeeks = selectedSubject ? PRESENCIAL_CALENDAR[getCuatrimestreFromCode(selectedSubject.code)] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-4 items-center bg-sidebar-bg p-3 rounded-xl border border-border-subtle transition-colors">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Referencia:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-blue shadow-sm" />
          <span className="text-[12px] font-medium text-text-main">Seleccionada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
          <span className="text-[12px] font-medium text-text-main">Materia Previa (Correlativa)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
          <span className="text-[12px] font-medium text-text-main">Siguiente Nivel (Habilitada)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {Object.entries(subjectsByYear).map(([year, subjects]) => (
          <div key={year} className="space-y-4">
            <h3 className="text-[14px] font-extrabold text-text-muted uppercase tracking-widest flex items-center gap-2 px-1">
              <Layers className="w-4 h-4" />
              {year} Año
            </h3>
            <div className="space-y-3">
              {subjects.map((subject, idx) => {
                const isSelected = selectedSubject?.code === subject.code;
                const isAncestor = ancestors.includes(subject.code);
                const isDescendant = descendants.includes(subject.code);

                return (
                  <motion.button
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={subject.code}
                    onClick={() => setSelectedSubject(subject)}
                    className={cn(
                      "w-full p-4 bg-sidebar-bg border border-border-subtle rounded-xl text-left transition-all hover:border-accent-blue hover:shadow-md group relative overflow-hidden",
                      isSelected && "ring-2 ring-accent-blue border-accent-blue bg-accent-blue/5",
                      isAncestor && "ring-2 ring-amber-500/50 border-amber-500 bg-amber-50 dark:bg-amber-500/10",
                      isDescendant && "ring-2 ring-emerald-500/50 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
                      !isSelected && !isAncestor && !isDescendant && "hover:border-accent-blue"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors",
                        isSelected ? "text-accent-blue bg-accent-blue/10" : 
                        isAncestor ? "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10" :
                        isDescendant ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10" :
                        "text-accent-blue bg-accent-blue/5"
                      )}>
                        {subject.code}
                      </span>
                      <span className="text-[10px] font-bold text-text-muted">{subject.period}</span>
                    </div>
                    <h4 className={cn(
                      "text-[14px] font-bold transition-colors leading-tight",
                      isSelected ? "text-accent-blue" :
                      isAncestor ? "text-amber-900 dark:text-amber-200" :
                      isDescendant ? "text-emerald-900 dark:text-emerald-200" :
                      "text-text-main group-hover:text-accent-blue"
                    )}>
                      {subject.name}
                    </h4>
                    
                    {/* Visual connection indicator */}
                    {(isAncestor || isDescendant) && (
                      <motion.div 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        className={cn(
                          "absolute bottom-0 left-0 h-0.5 w-full origin-left",
                          isAncestor ? "bg-amber-500" : "bg-emerald-500"
                        )} 
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedSubject && (
          <div className={cn(
            "fixed inset-0 z-[100] flex pointer-events-none",
            isMobile ? "items-end" : "justify-end"
          )}>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSubject(null)}
              className="absolute inset-0 bg-text-main/20 backdrop-blur-[2px] pointer-events-auto"
            />
            
            <motion.div
              initial={isMobile ? { y: '100%' } : { x: '100%' }}
              animate={
                isMobile 
                  ? { y: isMinimized ? 'calc(100% - 80px)' : 0 } 
                  : { x: isMinimized ? 'calc(100% - 60px)' : 0 }
              }
              exit={isMobile ? { y: '100%' } : { x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "bg-sidebar-bg text-text-main shadow-2xl flex flex-col relative pointer-events-auto overflow-hidden transition-all duration-300",
                isMobile 
                  ? "w-full h-[85dvh] rounded-t-[32px] border-t border-border-subtle" 
                  : cn("h-full border-l border-border-subtle", isMinimized ? "w-20" : "w-[480px]")
              )}
            >
              {isMinimized && !isMobile && (
                <button 
                  onClick={() => setIsMinimized(false)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 hover:bg-accent-blue/5 transition-colors group"
                >
                  <ArrowLeft className="w-5 h-5 text-accent-blue rotate-180" />
                  <span className="[writing-mode:vertical-lr] text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-accent-blue">Ver Detalles</span>
                </button>
              )}

              {/* Header */}
              <div className={cn(
                "p-6 sm:p-8 border-b border-border-subtle flex items-start justify-between bg-bg-base/50 backdrop-blur-md sticky top-0 z-20 transition-opacity",
                isMinimized && "opacity-0 pointer-events-none"
              )}>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-accent-blue/10 rounded-xl flex items-center justify-center shrink-0">
                    <Info className="w-6 h-6 text-accent-blue" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[20px] sm:text-[24px] font-bold tracking-tight leading-tight mb-1 truncate pr-8">{selectedSubject.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-accent-blue font-bold text-sm">{selectedSubject.teacher}</p>
                      <span className="text-text-muted/30">•</span>
                      <p className="text-text-muted text-xs font-mono">{selectedSubject.code}</p>
                    </div>
                    <button 
                      onClick={() => setIsMinimized(true)}
                      className="mt-2 text-[11px] font-bold text-accent-blue/70 hover:text-accent-blue underline underline-offset-4 flex items-center gap-1 transition-colors"
                    >
                      <Layers className="w-3 h-3" />
                      Ver mapa de correlatividades
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={() => setSelectedSubject(null)}
                    className={cn(
                      "p-2 hover:bg-bg-base transition-colors shrink-0 group flex flex-col items-center",
                      isMobile ? "w-12 -mt-2" : "rounded-full"
                    )}
                    aria-label="Cerrar detalles"
                  >
                    {isMobile ? (
                      <div className="w-10 h-1 bg-text-muted/20 rounded-full group-hover:bg-text-muted/40 transition-colors" />
                    ) : (
                      <XCircle className="w-5 h-5 text-text-muted hover:text-red-500 transition-colors" />
                    )}
                  </button>
                  {!isMobile && (
                    <button 
                      onClick={() => setIsMinimized(true)}
                      className="p-2 text-text-muted hover:text-accent-blue transition-colors"
                      title="Minimizar panel"
                    >
                      <ArrowLeft className="w-5 h-5 rotate-180" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className={cn(
                "flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar transition-opacity",
                isMinimized && "opacity-0 pointer-events-none"
              )}>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-bg-base border border-border-subtle">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Carga Horaria</p>
                    <p className="text-[16px] font-bold text-text-main">{selectedSubject.hours}h Semanales</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-bg-base border border-border-subtle">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1">Periodo</p>
                    <p className="text-[16px] font-bold text-text-main">{selectedSubject.period}</p>
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-4">
                  <h4 className="text-[11px] uppercase font-bold tracking-widest text-text-muted flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Días y Horarios
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(selectedSubject.schedule).map(([day, time]) => (
                      <div key={day} className="flex justify-between items-center bg-bg-base p-4 rounded-xl border border-border-subtle">
                        <span className="text-sm font-bold text-accent-blue">{day}</span>
                        <span className="text-sm font-mono text-text-main">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correlatives */}
                <div className="space-y-4">
                  <h4 className="text-[11px] uppercase font-bold tracking-widest text-text-muted flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Requisitos Previos (Ancestros)
                  </h4>
                  {selectedSubject.correlatives.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSubject.correlatives.map(code => (
                        <button 
                          key={code} 
                          onClick={() => {
                            const found = TSAS_PLAN.find(s => s.code === code);
                            if (found) {
                              setSelectedSubject(found);
                              setIsMinimized(true);
                            }
                          }}
                          className="w-full flex items-center gap-3 bg-bg-base p-4 rounded-xl border border-border-subtle hover:border-amber-500 hover:bg-amber-500/5 transition-all group"
                        >
                          <span className="text-xs font-mono font-bold text-amber-600 bg-amber-500/10 px-2 py-1 rounded shrink-0 group-hover:bg-amber-500/20">
                            {code}
                          </span>
                          <span className="text-[13px] font-medium text-text-main truncate group-hover:text-amber-700">{getSubjectName(code)}</span>
                          <ChevronRight className="w-4 h-4 ml-auto text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-border-subtle border-dashed text-center">
                      <p className="text-xs text-text-muted italic">Sin correlatividades previas</p>
                    </div>
                  )}
                </div>

                {/* Virtual Links */}
                {(selectedSubject.moodleUrl || selectedSubject.meetUrl) && (
                  <div className="space-y-4 pt-4 border-t border-border-subtle">
                    <h4 className="text-[11px] uppercase font-bold tracking-widest text-text-muted flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Enlaces Virtuales
                    </h4>
                    <div className="grid gap-3">
                      {selectedSubject.moodleUrl && (
                        <a 
                          href={ensureUrl(selectedSubject.moodleUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-4 bg-accent-blue/5 hover:bg-accent-blue/10 p-4 rounded-2xl border border-accent-blue/10 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center shrink-0">
                              <Globe className="w-5 h-5 text-accent-blue" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-main leading-none">Aula Virtual</p>
                              <p className="text-[11px] text-accent-blue font-medium mt-1">Moodle IFTS 18</p>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-accent-blue transition-colors" />
                        </a>
                      )}
                      {selectedSubject.meetUrl && (
                        <a 
                          href={ensureUrl(selectedSubject.meetUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-4 bg-emerald-500/5 hover:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/10 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                              <Video className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-main leading-none">Clase en Vivo</p>
                              <p className="text-[11px] text-emerald-500 font-medium mt-1">Google Meet</p>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-emerald-500 transition-colors" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Attendance Schedule */}
                {attendanceWeeks && attendanceWeeks.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-border-subtle">
                    <h4 className="text-[11px] uppercase font-bold tracking-widest text-text-muted flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Fechas de Presencialidad
                    </h4>
                    <div className="space-y-3">
                      {attendanceWeeks.map((item) => (
                        <div key={item.week} className="bg-bg-base border border-border-subtle p-4 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-accent-blue uppercase font-mono">SEMANA {item.week}</span>
                          </div>
                          <p className="text-[14px] font-bold text-text-main">{item.dates}</p>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.location.includes('PB') ? 'bg-emerald-500' : 
                              item.location.includes('Piso') ? 'bg-amber-500' : 'bg-accent-blue'
                            )} />
                            <span className="text-[12px] text-text-muted font-medium">{item.location}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-accent-blue/5 rounded-xl border border-accent-blue/10 flex items-start gap-3">
                      <Info className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
                      <p className="text-[11px] text-text-muted italic leading-relaxed">
                        Presencialidad alternada. El resto de las semanas la cursada es remota.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
