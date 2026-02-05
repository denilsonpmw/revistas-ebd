import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getToken } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useIsMobile } from '../hooks/useIsMobile';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { loginWithToken, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Se já está logado, redirecionar direto
    if (user) {
      const destination = isMobile && user.role !== 'ADMIN' ? '/pedido-mobile' : '/app';
      navigate(destination, { replace: true });
      return;
    }

    const verificationKey = token ? `verify:${token}` : null;
    if (verificationKey && sessionStorage.getItem(verificationKey)) {
      return;
    }

    if (!token || attempted) return;
    if (verificationKey) {
      sessionStorage.setItem(verificationKey, '1');
    }
    setAttempted(true);
    setLoading(true);
    
    // Usar a URL correta do API (URL relativa em produção, localhost em dev)
    const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');
    
    // Fazer um fetch GET direto
    fetch(`${apiUrl}/auth/verify?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Erro ao verificar token');
        }
        return data;
      })
      .then((data) => {
        if (data.token && data.user) {
          loginWithToken(data.token, data.user);
          const destination = isMobile ? '/pedido-mobile' : '/app';
          navigate(destination);
        } else {
          navigate('/login', { replace: true });
        }
      })
      .catch((err) => {
        const message = err.message || '';
        if (message.includes('Token já utilizado') || message.includes('Token expirado')) {
          if (getToken()) {
            const destination = isMobile ? '/pedido-mobile' : '/app';
            navigate(destination, { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
          return;
        }
        toast.error(message || 'Erro ao verificar token');
      })
      .finally(() => setLoading(false));
  }, [token, attempted, user, navigate, isMobile]);

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
