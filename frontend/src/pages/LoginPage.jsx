import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiRequest } from '../api/client';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const [waLink, setWaLink] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');

  const onSubmit = async (values) => {
    try {
      const data = await apiRequest('/auth/request-link', {
        method: 'POST',
        body: JSON.stringify({ whatsapp: values.whatsapp })
      });
      setWaLink(data.waLink);
      setVerifyUrl(data.verifyUrl || '');
      toast.success('Link gerado. Abra o WhatsApp para autenticar.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <h1 className="text-2xl font-semibold">Acesso Revistas EBD</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <label className="text-sm text-slate-300">WhatsApp</label>
          <input
            {...register('whatsapp', { required: true })}
            placeholder="Ex: 63992134567"
            className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          />
          <button className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900">
            Gerar link no WhatsApp
          </button>
        </form>
        {waLink && (
          <a
            href={waLink}
            className="rounded border border-emerald-500 px-4 py-3 text-center text-sm text-emerald-400"
          >
            Abrir WhatsApp com token
          </a>
        )}
        {verifyUrl && (
          <a
            href={verifyUrl}
            className="rounded border border-slate-700 px-4 py-3 text-center text-sm text-slate-300"
          >
            Verificar token no site
          </a>
        )}
        <div className="text-center mt-4">
          <Link
            to="/registro"
            className="text-sm text-slate-400 hover:text-slate-200 underline"
          >
            Não tem conta? Criar cadastro
          </Link>
        </div>
      </div>
    </div>
  );
}
