import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiRequest(`/auth/verify?token=${encodeURIComponent(token)}`)
      .then((data) => {
        loginWithToken(data.token, data.user);
        toast.success('Login realizado');
        navigate('/app');
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [token, loginWithToken, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-16">
        <h1 className="text-xl font-semibold">Validando acesso</h1>
        {loading && <p className="text-sm text-slate-300">Processando token...</p>}
        {!token && (
          <p className="text-sm text-slate-300">
            Token ausente. Abra o link do WhatsApp para continuar.
          </p>
        )}
      </div>
    </div>
  );
}
