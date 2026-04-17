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
      <div className="flex flex-wrap gap-4 items-center bg-white/50 p-3 rounded-xl border border-border-subtle">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      "w-full p-4 bg-white border border-border-subtle rounded-xl text-left transition-all hover:border-accent-blue hover:shadow-md group relative overflow-hidden",
                      isSelected && "ring-2 ring-accent-blue border-accent-blue bg-accent-blue/5",
                      isRequirement && "ring-2 ring-amber-500/50 border-amber-500 bg-amber-50",
                      isDependent && "ring-2 ring-emerald-500/50 border-emerald-500 bg-emerald-50",
                      !isSelected && !isRequirement && !isDependent && "hover:border-accent-blue"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors",
                        isSelected ? "text-accent-blue bg-accent-blue/10" : 
                        isRequirement ? "text-amber-700 bg-amber-100" :
                        isDependent ? "text-emerald-700 bg-emerald-100" :
                        "text-accent-blue bg-accent-blue/5"
                      )}>
                        {subject.code}
                      </span>
                      <span className="text-[10px] font-bold text-text-muted">{subject.period}</span>
                    </div>
                    <h4 className={cn(
                      "text-[14px] font-bold transition-colors leading-tight",
                      isSelected ? "text-accent-blue" :
                      isRequirement ? "text-amber-900" :
                      isDependent ? "text-emerald-900" :
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
            className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
          >
            <div className="bg-text-main text-white rounded-2xl shadow-2xl p-6 border border-white/10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <button 
                  onClick={() => setSelectedSubject(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 rotate-90" />
                </button>
              </div>

              <div className="flex gap-4 items-start mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold leading-tight pr-8">{selectedSubject.name}</h3>
                  <p className="text-accent-blue font-bold text-sm mt-1">{selectedSubject.teacher}</p>
                  <p className="text-white/60 text-[12px] mt-0.5">Código: {selectedSubject.code} • {selectedSubject.hours} Horas Semanales</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Días y Horarios de Cursada
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(selectedSubject.schedule).map(([day, time]) => (
                      <div key={day} className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-lg border border-white/5">
                        <span className="text-xs font-bold text-accent-blue">{day}</span>
                        <span className="text-xs font-mono text-white/80">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Requisitos de Correlatividad
                  </h4>
                  {selectedSubject.correlatives.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSubject.correlatives.map(code => (
                        <div key={code} className="flex items-center gap-3 bg-white/5 p-2 px-3 rounded-lg border border-white/5">
                          <span className="text-[10px] font-mono font-bold text-accent-blue/80 bg-accent-blue/10 px-1 py-0.5 rounded shrink-0">
                            {code}
                          </span>
                          <span className="text-[11px] font-medium truncate">{getSubjectName(code)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/40 italic py-2">Sin correlatividades previas.</p>
                  )}
                </div>
              </div>

              {(selectedSubject.moodleUrl || selectedSubject.meetUrl) && (
                <div className="pt-6 mt-6 border-t border-white/10">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    Aulas Virtuales y Encuentros
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {selectedSubject.moodleUrl && (
                      <a 
                        href={ensureUrl(selectedSubject.moodleUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[200px] flex items-center justify-between gap-3 bg-accent-blue/10 hover:bg-accent-blue/20 p-3 rounded-xl border border-accent-blue/20 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-accent-blue" />
                          <div>
                            <p className="text-xs font-bold text-white leading-none">Aula Virtual</p>
                            <p className="text-[10px] text-accent-blue font-medium mt-1">Moodle (Plataforma)</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                      </a>
                    )}
                    {selectedSubject.meetUrl && (
                      <a 
                        href={ensureUrl(selectedSubject.meetUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[200px] flex items-center justify-between gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/20 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Video className="w-5 h-5 text-emerald-500" />
                          <div>
                            <p className="text-xs font-bold text-white leading-none">Clase en Vivo</p>
                            <p className="text-[10px] text-emerald-500 font-medium mt-1">Google Meet / Classroom</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {attendanceWeeks && attendanceWeeks.length > 0 && (
                <div className="pt-6 mt-6 border-t border-white/10">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-3 flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    Cronograma de Presencialidad (IFTS 18)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {attendanceWeeks.map((item) => (
                      <div key={item.week} className="bg-white/5 border border-white/10 p-2 px-3 rounded-xl flex flex-col gap-1 transition-all hover:bg-white/10">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-accent-blue uppercase">Semana {item.week}</span>
                          <span className="text-[9px] font-medium text-white/40">1° Cuat. 2026</span>
                        </div>
                        <p className="text-[11px] font-bold text-white">{item.dates}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            item.location.includes('PB') ? 'bg-emerald-500' : 
                            item.location.includes('Piso') ? 'bg-amber-500' : 'bg-accent-blue'
                          )} />
                          <span className="text-[10px] text-white/60 font-medium truncate">{item.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[11px] text-white/30 italic flex items-start gap-2">
                    <Info className="w-3 h-3 shrink-0 mt-0.5" />
                    El resto de las semanas la cursada se realiza de manera remota a través del Aula Virtual y Google Meet.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
