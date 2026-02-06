import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiRequest } from '../api/client';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const data = await apiRequest('/auth/request-link', {
        method: 'POST',
        body: JSON.stringify({ 
          whatsapp: values.whatsapp,
          password: values.password
        })
      });
      
      // Extrair o token da URL de verificação
      const tokenMatch = data.verifyUrl?.match(/token=([^&]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        navigate(`/verificar?token=${token}`);
      } else {
        toast.error('Erro ao gerar link de autenticação');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <div className="flex items-center justify-end">
          <ThemeToggle />
        </div>
        <div className="relative -mx-4 -mt-16 mb-2">
          <div className="relative h-28 w-full">
            <svg
              viewBox="0 0 375 180"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
            >
              <rect width="375" height="180" fill="#0f172a" className="login-hero-bg" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/logo-original.svg"
                alt="Revistas EBD"
                className="h-20 w-20"
              />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-semibold">Acesso Revistas EBD</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-slate-300">WhatsApp</label>
            <input
              {...register('whatsapp', { required: true })}
              placeholder="Ex: 63992134567"
              className="w-full mt-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-400">
              Digite seu número de WhatsApp (apenas números)
            </p>
          </div>
          <div>
            <label className="text-sm text-slate-300">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: true })}
                placeholder="Digite sua senha"
                className="w-full mt-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-sm"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                disabled={loading}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link
            to="/registro"
            className="text-sm text-slate-400 hover:text-slate-200 underline"
          >
            Não tem conta? Criar cadastro
          </Link>
          <span className="text-slate-600 mx-2">•</span>
          <a
            href="https://wa.me/5563992081525"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-400 hover:text-slate-200 underline"
          >
            Esqueceu a senha?
          </a>
        </div>
        <div className="mt-6 p-4 rounded border border-slate-700 bg-slate-900/50">
          <p className="text-xs text-slate-400">
            💡 <strong>Esqueceu a senha?</strong> Entre em contato com o administrador para resetar sua senha.
          </p>
        </div>
      </div>
    </div>
  );
}
