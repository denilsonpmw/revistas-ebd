import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiRequest } from '../api/client';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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
            <input
              type="password"
              {...register('password', { required: true })}
              placeholder="Digite sua senha"
              className="w-full mt-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              disabled={loading}
            />
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
