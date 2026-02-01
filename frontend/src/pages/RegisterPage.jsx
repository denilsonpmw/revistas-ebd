import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Query para buscar congregações
  const { data: congregations = [] } = useQuery({
    queryKey: ['congregations'],
    queryFn: async () => {
      return await api.get('/auth/congregations');
    }
  });

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Cadastro Enviado!
            </h2>
            <p className="text-gray-600 mb-6">
              Seu cadastro foi enviado com sucesso. Aguarde a aprovação do administrador para acessar o sistema.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Você receberá uma notificação quando seu cadastro for aprovado.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Criar Conta
          </h1>
          <p className="text-gray-600">
            Sistema de Controle de Pedidos de Revistas EBD
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              {...register('name', { 
                required: 'Nome é obrigatório',
                minLength: { value: 3, message: 'Nome deve ter pelo menos 3 caracteres' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Seu nome completo"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp *
            </label>
            <input
              type="text"
              {...register('whatsapp', { 
                required: 'WhatsApp é obrigatório',
                minLength: { value: 10, message: 'WhatsApp deve ter pelo menos 10 dígitos' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="11999999999"
            />
            <p className="mt-1 text-xs text-gray-500">
              Digite apenas números (DDD + número)
            </p>
            {errors.whatsapp && (
              <p className="mt-1 text-sm text-red-600">{errors.whatsapp.message}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha *
            </label>
            <input
              type="password"
              {...register('password', { 
                required: 'Senha é obrigatória',
                minLength: { value: 4, message: 'Senha deve ter pelo menos 4 caracteres' }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Crie uma senha"
            />
            <p className="mt-1 text-xs text-gray-500">
              Mínimo de 4 caracteres
            </p>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Congregação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Congregação *
            </label>
            <select
              {...register('congregationId', { required: 'Congregação é obrigatória' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione sua congregação</option>
              {congregations.map((cong) => (
                <option key={cong.id} value={cong.id}>
                  {cong.name} - {cong.area.name}
                </option>
              ))}
            </select>
            {errors.congregationId && (
              <p className="mt-1 text-sm text-red-600">{errors.congregationId.message}</p>
            )}
          </div>

          {/* Informação */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Após o cadastro:</strong> Seu acesso será liberado após aprovação do administrador. Você receberá uma notificação quando puder fazer login.
            </p>
          </div>

          {/* Botões */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {registerMutation.isPending ? 'Enviando...' : 'Criar Conta'}
            </button>

            <div className="text-center">
              <Link
                to="/"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Já tem conta? Fazer login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
