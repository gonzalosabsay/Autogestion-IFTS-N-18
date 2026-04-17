/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { cn } from './lib/utils';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/Common/ErrorBoundary';
import { GraduationCap, Loader2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'login' | 'register'>('login');
  const [activeNav, setActiveNav] = useState<'procedures' | 'templates' | 'authorities' | 'wizard' | 'academic_plan'>('procedures');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const path = `users/${firebaseUser.uid}`;
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef).catch(err => {
          handleFirestoreError(err, OperationType.GET, path);
          throw err;
        });
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => auth.signOut();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium font-sans">Cargando sistema...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg-base font-sans text-text-main flex overflow-hidden">
        {user && profile ? (
          <>
            {/* Sidebar */}
            <aside className="w-[260px] bg-sidebar-bg border-r border-border-subtle flex flex-col p-8 fixed h-full z-20">
              <div className="flex items-center gap-2.5 mb-12">
                <div className="w-8 h-8 bg-primary-brand rounded-lg flex items-center justify-center text-white">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-[18px] font-extrabold tracking-tight text-primary-brand leading-tight">AUTOGESTIÓN IFTS 18</span>
              </div>

              <nav className="flex-1">
                <ul className="space-y-2">
                  {profile.role === 'student' && (
                    <>
                      <li>
                        <button 
                          onClick={() => setActiveNav('wizard')}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-lg transition-colors text-left",
                            activeNav === 'wizard' ? "text-text-main bg-bg-base shadow-sm" : "text-text-muted hover:text-text-main"
                          )}
                        >
                          Nueva Solicitud
                        </button>
                      </li>
                      {profile.career === 'TSAS' && (
                        <li>
                          <button 
                            onClick={() => setActiveNav('academic_plan')}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-lg transition-colors text-left",
                              activeNav === 'academic_plan' ? "text-text-main bg-bg-base shadow-sm" : "text-text-muted hover:text-text-main"
                            )}
                          >
                            Plan de Estudios
                          </button>
                        </li>
                      )}
                    </>
                  )}
                  <li>
                    <button 
                      onClick={() => setActiveNav('procedures')}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-lg transition-colors text-left",
                        activeNav === 'procedures' ? "text-text-main bg-bg-base shadow-sm" : "text-text-muted hover:text-text-main"
                      )}
                    >
                      {profile.role === 'admin' ? 'Expedientes' : 'Mis Expedientes'}
                    </button>
                  </li>
                  {profile.role === 'admin' && (
                    <>
                      <li>
                        <button 
                          onClick={() => setActiveNav('templates')}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-lg transition-colors text-left",
                            activeNav === 'templates' ? "text-text-main bg-bg-base shadow-sm" : "text-text-muted hover:text-text-main"
                          )}
                        >
                          Plantillas
                        </button>
                      </li>
                      <li>
                        <button 
                          onClick={() => setActiveNav('authorities')}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-lg transition-colors text-left",
                            activeNav === 'authorities' ? "text-text-main bg-bg-base shadow-sm" : "text-text-muted hover:text-text-main"
                          )}
                        >
                          Firmas
                        </button>
                      </li>
                    </>
                  )}
                  <div className="pt-4 mt-4 border-t border-border-subtle opacity-50">
                    <li>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-text-muted rounded-lg cursor-not-allowed">
                        Calendario Académico
                      </button>
                    </li>
                    <li>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-text-muted rounded-lg cursor-not-allowed">
                        Notificaciones
                      </button>
                    </li>
                  </div>
                </ul>
              </nav>

              <div className="mt-auto pt-6 border-t border-border-subtle flex items-center justify-between group">
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold">{profile.fullName}</span>
                  <span className="text-[12px] text-text-muted uppercase">DNI {profile.dni}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-text-muted hover:text-red-600 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-[260px] p-12 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <Dashboard 
                    profile={profile} 
                    activeNav={activeNav} 
                    onNavChange={(nav) => setActiveNav(nav)}
                  />
                </motion.div>
              </AnimatePresence>
              
              <footer className="mt-12 text-sm text-text-muted">
                &copy; {new Date().getFullYear()} Institución Educativa • Sistema de Gestión Académica
              </footer>
            </main>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex justify-center w-full"
              >
                {view === 'login' ? (
                  <Login onSwitch={() => setView('register')} />
                ) : (
                  <Register onSwitch={() => setView('login')} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

