import React, { useState } from 'react';
import { TSAS_PLAN, Subject } from '../constants/academic-plan';
import { Book, Info, ArrowLeft, Layers, Clock, Calendar, Video, Globe, ExternalLink, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { PRESENCIAL_CALENDAR, getCuatrimestreFromCode } from '../constants/presencial-calendar';

export default function AcademicPlan() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

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
              {subjects.map((subject) => {
                const isSelected = selectedSubject?.code === subject.code;
                const isRequirement = selectedSubject?.correlatives.includes(subject.code);
                const isDependent = subject.correlatives.includes(selectedSubject?.code || '');

                return (
                  <button
                    key={subject.code}
                    onClick={() => setSelectedSubject(subject)}
                    className={cn(
                      "w-full p-4 bg-sidebar-bg border border-border-subtle rounded-xl text-left transition-all hover:border-accent-blue hover:shadow-md group relative overflow-hidden",
                      isSelected && "ring-2 ring-accent-blue border-accent-blue bg-accent-blue/5",
                      isRequirement && "ring-2 ring-amber-500/50 border-amber-500 bg-amber-50 dark:bg-amber-500/10",
                      isDependent && "ring-2 ring-emerald-500/50 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
                      !isSelected && !isRequirement && !isDependent && "hover:border-accent-blue"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors",
                        isSelected ? "text-accent-blue bg-accent-blue/10" : 
                        isRequirement ? "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10" :
                        isDependent ? "text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10" :
                        "text-accent-blue bg-accent-blue/5"
                      )}>
                        {subject.code}
                      </span>
                      <span className="text-[10px] font-bold text-text-muted">{subject.period}</span>
                    </div>
                    <h4 className={cn(
                      "text-[14px] font-bold transition-colors leading-tight",
                      isSelected ? "text-accent-blue" :
                      isRequirement ? "text-amber-900 dark:text-amber-200" :
                      isDependent ? "text-emerald-900 dark:text-emerald-200" :
                      "text-text-main group-hover:text-accent-blue"
                    )}>
                      {subject.name}
                    </h4>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedSubject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 lg:inset-auto lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 w-full lg:max-w-4xl z-50 px-0 lg:px-4 flex items-end lg:items-center justify-center pointer-events-none"
          >
            <div className="bg-[#111827] dark:bg-sidebar-bg text-white w-full h-[90vh] lg:h-auto rounded-t-3xl lg:rounded-2xl shadow-2xl p-6 lg:p-8 border-t lg:border border-white/10 overflow-y-auto pointer-events-auto relative custom-scrollbar transition-colors">
              <div className="sticky top-0 right-0 flex justify-end z-10 mb-[-32px]">
                <button 
                  onClick={() => setSelectedSubject(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md"
                >
                  <ArrowLeft className="w-5 h-5 rotate-90 lg:rotate-0" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Info className="w-8 h-8 text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-bold leading-tight pr-10">{selectedSubject.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                    <p className="text-accent-blue font-bold text-base">{selectedSubject.teacher}</p>
                    <span className="text-white/20 hidden sm:inline">|</span>
                    <p className="text-white/60 text-sm">Código: {selectedSubject.code}</p>
                    <span className="text-white/20 hidden sm:inline">|</span>
                    <p className="text-white/60 text-sm">{selectedSubject.hours} Horas Semanales</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                <div className="space-y-4">
                  <h4 className="text-[12px] uppercase font-bold tracking-widest text-white/40 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Días y Horarios de Cursada
                  </h4>
                  <div className="grid gap-2">
                    {Object.entries(selectedSubject.schedule).map(([day, time]) => (
                      <div key={day} className="flex justify-between items-center bg-white/5 p-3 px-4 rounded-xl border border-white/5">
                        <span className="text-sm font-bold text-accent-blue">{day}</span>
                        <span className="text-sm font-mono text-white/80">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[12px] uppercase font-bold tracking-widest text-white/40 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Requisitos de Correlatividad
                  </h4>
                  {selectedSubject.correlatives.length > 0 ? (
                    <div className="grid gap-2">
                      {selectedSubject.correlatives.map(code => (
                        <div key={code} className="flex items-center gap-3 bg-white/5 p-3 px-4 rounded-xl border border-white/5">
                          <span className="text-xs font-mono font-bold text-accent-blue/80 bg-accent-blue/10 px-2 py-1 rounded shrink-0">
                            {code}
                          </span>
                          <span className="text-xs font-medium truncate">{getSubjectName(code)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                      <p className="text-sm text-white/40 italic">Sin correlatividades previas.</p>
                    </div>
                  )}
                </div>
              </div>

              {(selectedSubject.moodleUrl || selectedSubject.meetUrl) && (
                <div className="pt-8 mt-8 border-t border-white/10">
                  <h4 className="text-[12px] uppercase font-bold tracking-widest text-white/40 mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Aulas Virtuales y Encuentros
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedSubject.moodleUrl && (
                      <a 
                        href={ensureUrl(selectedSubject.moodleUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-4 bg-accent-blue/10 hover:bg-accent-blue/20 p-4 rounded-2xl border border-accent-blue/20 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-accent-blue/20 rounded-xl flex items-center justify-center shrink-0">
                            <Globe className="w-5 h-5 text-accent-blue" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white leading-none">Aula Virtual</p>
                            <p className="text-[11px] text-accent-blue font-medium mt-1">Moodle (Plataforma)</p>
                          </div>
                        </div>
                        <ExternalLink className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                      </a>
                    )}
                    {selectedSubject.meetUrl && (
                      <a 
                        href={ensureUrl(selectedSubject.meetUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-4 bg-emerald-500/10 hover:bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/20 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                            <Video className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white leading-none">Clase en Vivo</p>
                            <p className="text-[11px] text-emerald-500 font-medium mt-1">Google Meet / Classroom</p>
                          </div>
                        </div>
                        <ExternalLink className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {attendanceWeeks && attendanceWeeks.length > 0 && (
                <div className="pt-8 mt-8 border-t border-white/10">
                  <h4 className="text-[12px] uppercase font-bold tracking-widest text-white/40 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Cronograma de Presencialidad (IFTS 18)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attendanceWeeks.map((item) => (
                      <div key={item.week} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-2 transition-all hover:bg-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-accent-blue uppercase tracking-tighter">Semana {item.week}</span>
                          <span className="text-[10px] font-medium text-white/40">1° Cuat. 2026</span>
                        </div>
                        <p className="text-[13px] font-bold text-white">{item.dates}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            item.location.includes('PB') ? 'bg-emerald-500' : 
                            item.location.includes('Piso') ? 'bg-amber-500' : 'bg-accent-blue'
                          )} />
                          <span className="text-[12px] text-white/60 font-medium truncate">{item.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
                    <Info className="w-5 h-5 text-accent-blue shrink-0 mt-0.5" />
                    <p className="text-[12px] text-white/50 italic leading-relaxed">
                      El resto de las semanas la cursada se realiza de manera remota a través del Aula Virtual y Google Meet. Las fechas son orientativas y pueden sufrir modificaciones.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
