import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

interface LoginProps {
  onSwitch: () => void;
}

export default function Login({ onSwitch }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Credenciales inválidas. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-sidebar-bg p-6 sm:p-10 rounded-2xl border border-border-subtle shadow-sm transition-colors duration-300">
      <div className="mb-10">
        <h2 className="text-[28px] font-bold tracking-tight text-text-main">Bienvenido</h2>
        <p className="text-text-muted mt-2">Inicia sesión para gestionar tus trámites</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[12px] uppercase tracking-wider font-semibold text-text-muted mb-2">Correo Institucional</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none transition-all placeholder:text-text-muted/40 text-text-main"
              placeholder="usuario@ifts18.edu.ar"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] uppercase tracking-wider font-semibold text-text-muted mb-2">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none transition-all placeholder:text-text-muted/40 text-text-main"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-100 dark:border-red-500/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-brand hover:opacity-90 disabled:opacity-50 text-bg-base font-semibold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Ingresando...' : (
            <>
              <LogIn className="w-4 h-4" />
              Ingresar
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-border-subtle text-center">
        <p className="text-text-muted text-sm font-medium">
          ¿No tienes una cuenta?{' '}
          <button
            onClick={onSwitch}
            className="text-accent-blue font-bold hover:underline"
          >
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
}
