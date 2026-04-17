import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { UserPlus, Mail, Lock, User, IdCard, BookOpen, AlertCircle } from 'lucide-react';

interface RegisterProps {
  onSwitch: () => void;
}

export default function Register({ onSwitch }: RegisterProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    dni: '',
    career: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const allowedDomains = ['@ifts18.edu.ar', '@bue.edu.ar'];
    const isAllowedDomain = allowedDomains.some(domain => formData.email.endsWith(domain));

    if (!isAllowedDomain) {
      setError('Solo se permiten correos con el dominio @ifts18.edu.ar o @bue.edu.ar');
      setLoading(false);
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        fullName: formData.fullName,
        dni: formData.dni,
        career: formData.career,
        role: (formData.dni === '38616850' || formData.email === 'gonzalosabsay@ifts18.edu.ar') ? 'admin' : 'student',
      });
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full max-w-md bg-white p-10 rounded-2xl border border-border-subtle">
      <div className="mb-8">
        <h2 className="text-[28px] font-bold tracking-tight text-text-main">Registro</h2>
        <p className="text-text-muted mt-2">Crea tu cuenta institucional</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[12px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">Nombre Completo</label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
            <input
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none transition-all placeholder:text-text-muted/40"
              placeholder="Juan Pérez"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">DNI</label>
            <div className="relative">
              <IdCard className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
              <input
                name="dni"
                required
                value={formData.dni}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none transition-all placeholder:text-text-muted/40"
                placeholder="12345678"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">Carrera</label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted z-10" />
              <select
                name="career"
                required
                value={formData.career}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none transition-all appearance-none cursor-pointer text-sm"
              >
                <option value="" disabled>Seleccionar...</option>
                <option value="TSAS">TSAS</option>
                <option value="TSDS">TSDS</option>
                <option value="TSCDIA">TSCDIA</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[12px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none transition-all placeholder:text-text-muted/40"
              placeholder="alumno@institucion.edu"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] uppercase tracking-wider font-semibold text-text-muted mb-1.5">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-text-muted" />
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 bg-bg-base border border-border-subtle rounded-lg focus:ring-1 focus:ring-accent-blue outline-none transition-all placeholder:text-text-muted/40"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-xs">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-brand hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {loading ? 'Creando cuenta...' : (
            <>
              <UserPlus className="w-4 h-4" />
              Registrarse
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-border-subtle text-center">
        <p className="text-text-muted text-sm font-medium">
          ¿Ya tienes una cuenta?{' '}
          <button
            onClick={onSwitch}
            className="text-accent-blue font-bold hover:underline"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    </div>
  );
}
