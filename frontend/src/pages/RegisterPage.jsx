import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Query para buscar congregações
  const { data: congregationsData = [] } = useQuery({
    queryKey: ['congregations'],
    queryFn: async () => {
      const response = await api.get('/auth/congregations');
      return response.congregations || response;
    }
  });

  const congregations = Array.isArray(congregationsData) ? congregationsData : congregationsData?.congregations || [];

  // Mutation para registrar usuário
  const registerMutation = useMutation({
    mutationFn: async (userData) => {
      return await api.post('/auth/register', userData);
    },
    onSuccess: (data) => {
      setShowSuccess(true);
      reset();
      toast.success(data.message || 'Cadastro enviado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar cadastro');
    }
  });

  const onSubmit = (data) => {
    registerMutation.mutate(data);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="mx-auto flex max-w-md flex-col gap-6 w-full">
          <div className="flex items-center justify-end">
            <ThemeToggle />
          </div>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/20 mb-4">
              <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-100 mb-2">
              Cadastro Enviado!
            </h2>
            <p className="text-slate-400 mb-6">
              Seu cadastro foi enviado com sucesso. Aguarde a aprovação do administrador para acessar o sistema.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Você receberá uma notificação quando seu cadastro for aprovado.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-2 text-sm font-semibold rounded bg-emerald-500 text-slate-900 hover:bg-emerald-600"
            >
              Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <div className="flex items-center justify-end">
          <ThemeToggle />
        </div>
        <h1 className="text-2xl font-semibold">Criar Cadastro</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Nome */}
          <div>
            <label className="text-sm text-slate-300">Nome Completo *</label>
            <input
              type="text"
              {...register('name', { 
                required: 'Nome é obrigatório',
                minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' }
              })}
              className="w-full mt-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
              placeholder="Seu nome completo"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="text-sm text-slate-300">WhatsApp *</label>
            <input
              type="text"
              {...register('whatsapp', { 
                required: 'WhatsApp é obrigatório',
                minLength: { value: 10, message: 'WhatsApp deve ter pelo menos 10 dígitos' }
              })}
              className="w-full mt-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
              placeholder="63 999999999"
            />
            <p className="mt-1 text-xs text-slate-400">
              Digite apenas números (DDD + número)
            </p>
            {errors.whatsapp && (
              <p className="mt-1 text-xs text-red-400">{errors.whatsapp.message}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="text-sm text-slate-300">Senha *</label>
            <input
              type="password"
              {...register('password', { 
                required: 'Senha é obrigatória',
                minLength: { value: 4, message: 'Senha deve ter pelo menos 4 caracteres' }
              })}
              className="w-full mt-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500"
              placeholder="Crie uma senha"
            />
            <p className="mt-1 text-xs text-slate-400">
              Mínimo de 4 caracteres
            </p>
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Congregação */}
          <div>
            <label className="text-sm text-slate-300">Congregação *</label>
            <select
              {...register('congregationId', { required: 'Congregação é obrigatória' })}
              className="w-full mt-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              <option value="" className="bg-slate-900">Selecione sua congregação</option>
              {congregations.map((cong) => (
                <option key={cong.id} value={cong.id} className="bg-slate-900">
                  {cong.name} - {cong.area.name}
                </option>
              ))}
            </select>
            {errors.congregationId && (
              <p className="mt-1 text-xs text-red-400">{errors.congregationId.message}</p>
            )}
          </div>

          {/* Informação */}
          <div className="p-4 rounded border border-slate-700 bg-slate-900/50 mt-2">
            <p className="text-xs text-slate-400">
              💡 <strong>Após o cadastro:</strong> Seu acesso será liberado após aprovação do administrador.
            </p>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {registerMutation.isPending ? 'Enviando...' : 'Criar Conta'}
          </button>

          {/* Link para Login */}
          <div className="text-center mt-4">
            <Link
              to="/"
              className="text-sm text-slate-400 hover:text-slate-200 underline"
            >
              Já tem conta? Fazer login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
