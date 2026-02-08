import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

const statusPT = {
  PENDING: 'Pendente',
  APPROVED: 'Pago',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado'
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiRequest('/orders'),
    refetchInterval: 10000
  });

  const periodsQuery = useQuery({
    queryKey: ['periods'],
    queryFn: () => apiRequest('/periods')
  });

  const duplicateOrderMutation = useMutation({
    mutationFn: (lastOrder) =>
      apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          periodId: periodsQuery.data?.periods?.find(p => p.active && new Date() >= new Date(p.startDate) && new Date() <= new Date(p.endDate))?.id,
          items: lastOrder.items.map(item => ({
            magazineId: item.magazineId,
            quantity: item.quantity
          })),
          observations: `Duplicado do pedido #${lastOrder.number ? String(lastOrder.number).padStart(4, '0') : lastOrder.id?.slice(0, 8)}`
        })
      }),
    onSuccess: () => {
      toast.success('Pedido duplicado com sucesso!');
      ordersQuery.refetch();
      navigate('/app/pedidos');
    },
    onError: (err) => toast.error(err.message)
  });

  const orders = ordersQuery.data?.orders || [];
  const periods = periodsQuery.data?.periods || [];
  
  const myOrders = orders.filter(o => o.congregationId === user?.congregationId);
  const totalOrders = myOrders.length;
  const pendingOrders = myOrders.filter(o => o.status === 'PENDING').length;
  const approvedOrders = myOrders.filter(o => o.status === 'APPROVED').length;
  const deliveredOrders = myOrders.filter(o => o.status === 'DELIVERED').length;
  
  // Calcular valor total a partir dos items de cada pedido
  const totalValue = myOrders.reduce((sum, order) => {
    const orderTotal = (order.items || []).reduce((itemSum, item) => 
      itemSum + Number(item.totalValue || 0), 0
    );
    return sum + orderTotal;
  }, 0);

  // Período atual (aberto para pedidos = ativo e dentro do intervalo de datas)
  const currentPeriod = periods.find(p => {
    if (!p.active) return false;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return startOfToday >= startDay && startOfToday <= endDay;
  });

  // Período anterior (mais recente anterior ao atual)
  const previousPeriod = periods
    .filter(p => !p.active || new Date(p.endDate) < new Date(currentPeriod?.startDate || new Date()))
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];

  // Calcular valor do período anterior
  const previousPeriodValue = previousPeriod
    ? myOrders
        .filter(o => o.periodId === previousPeriod.id)
        .reduce((sum, order) => {
          const orderTotal = (order.items || []).reduce((itemSum, item) => 
            itemSum + Number(item.totalValue || 0), 0
          );
          return sum + orderTotal;
        }, 0)
    : 0;

  // Calcular variação percentual
  const valueVariation = previousPeriodValue > 0 
    ? ((totalValue - previousPeriodValue) / previousPeriodValue) * 100 
    : (totalValue > 0 ? 100 : 0);

  // Calcular dias restantes do período
  const daysUntilPeriodEnd = currentPeriod
    ? Math.max(
        0,
        Math.round(
          (new Date(
            new Date(currentPeriod.endDate).getFullYear(),
            new Date(currentPeriod.endDate).getMonth(),
            new Date(currentPeriod.endDate).getDate()
          ) - new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // Dados para gráfico - Trimestres do ano
  const getTrimesters = () => {
    return [
      { name: 'Trimestre 1', startMonth: 0, endMonth: 2 },   // Jan-Mar
      { name: 'Trimestre 2', startMonth: 3, endMonth: 5 },   // Abr-Jun
      { name: 'Trimestre 3', startMonth: 6, endMonth: 8 },   // Jul-Set
      { name: 'Trimestre 4', startMonth: 9, endMonth: 11 }   // Out-Dez
    ];
  };

  const currentYear = new Date().getFullYear();
  const trimesterOrders = getTrimesters().map((trimester, idx) => {
    const total = myOrders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate.getFullYear() === currentYear &&
          orderDate.getMonth() >= trimester.startMonth &&
          orderDate.getMonth() <= trimester.endMonth
        );
      })
      .reduce((sum, order) => {
        const orderTotal = (order.items || []).reduce((itemSum, item) => 
          itemSum + Number(item.totalValue || 0), 0
        );
        return sum + orderTotal;
      }, 0);
    return { name: trimester.name, valor: total };
  }).filter(t => t.valor > 0);

  // Últimos 5 pedidos
  const recentOrders = [...myOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Dados para gráfico - Pedidos por Classe
  const ordersByClass = myOrders.reduce((acc, order) => {
    if (!order.items || !Array.isArray(order.items)) return acc;
    
    order.items.forEach(item => {
      const className = item.magazine?.className || 'Outros';
      const existing = acc.find(entry => entry.name === className);
      if (existing) {
        existing.quantidade += item.quantity || 0;
      } else {
        acc.push({ name: className, quantidade: item.quantity || 0 });
      }
    });
    return acc;
  }, []).sort((a, b) => b.quantidade - a.quantidade);

  // Dados para gráfico - Top 5 Revistas com Variações
  const ordersByMagazine = myOrders.reduce((acc, order) => {
    if (!order.items || !Array.isArray(order.items)) return acc;
    
    order.items.forEach(item => {
      const magazineName = item.magazine?.name || 'Desconhecida';
      const variantName = item.variantCombination?.name || item.variantData?.combinationName || 'Sem variação';
      const displayName = `${magazineName} - ${variantName}`;
      
      const existing = acc.find(entry => entry.name === displayName);
      if (existing) {
        existing.quantidade += item.quantity || 0;
      } else {
        acc.push({ name: displayName, quantidade: item.quantity || 0 });
      }
    });
    return acc;
  }, []).sort((a, b) => b.quantidade - a.quantidade);

  // Dados para gráfico - Pedidos por Área
  const ordersByArea = orders.reduce((acc, order) => {
    const areaName = order.congregation?.area?.name || 'Sem Área';
    const existing = acc.find(a => a.name === areaName);
    if (existing) {
      existing.quantidade += 1;
    } else {
      acc.push({ name: areaName, quantidade: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.quantidade - a.quantidade);

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho com Boas-vindas */}
      <div>
        <h2 className="text-2xl font-bold">Olá, {user?.name}! 👋</h2>
        <p className="text-sm text-slate-400 mt-1">{user?.congregation?.name}</p>
      </div>

      {/* Notificação de Período Atual e Alertas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Período Atual */}
        {currentPeriod && (
          <div className={`rounded-lg border p-4 flex items-center gap-3 ${
            daysUntilPeriodEnd <= 3
              ? 'border-red-800 bg-gradient-to-r from-red-900/50 to-red-800/30'
              : daysUntilPeriodEnd <= 14
              ? 'border-yellow-800 bg-gradient-to-r from-yellow-900/50 to-yellow-800/30'
              : 'border-emerald-800 bg-gradient-to-r from-emerald-900/50 to-emerald-800/30'
          }`}>
            <div className="text-2xl">{daysUntilPeriodEnd <= 3 ? '🚨' : daysUntilPeriodEnd <= 14 ? '⚠️' : '📅'}</div>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm ${
                daysUntilPeriodEnd <= 3 ? 'text-red-200' : daysUntilPeriodEnd <= 14 ? 'text-yellow-200' : 'text-emerald-200'
              }`}>
                {daysUntilPeriodEnd <= 3 ? 'Urgente! Encerrando' : daysUntilPeriodEnd <= 14 ? 'Encerrando em breve' : 'Período aberto'}
              </div>
              <div className={`text-xs ${
                daysUntilPeriodEnd <= 3 ? 'text-red-300' : daysUntilPeriodEnd <= 14 ? 'text-yellow-300' : 'text-emerald-300'
              }`}>
                {daysUntilPeriodEnd > 0 ? (
                  <>{daysUntilPeriodEnd} {daysUntilPeriodEnd === 1 ? 'dia' : 'dias'} restantes</>
                ) : (
                  <>Fecha hoje</>
                )}
              </div>
            </div>
          </div>
        )}

        {!currentPeriod && (
          <div className="rounded-lg border border-yellow-800 bg-gradient-to-r from-yellow-900/50 to-yellow-800/30 p-4 flex items-center gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-yellow-200 text-sm">
                Nenhum período aberto
              </div>
              <div className="text-xs text-yellow-300">
                Aguarde um novo período
              </div>
            </div>
          </div>
        )}

        {/* Fazer Novo Pedido */}
        {currentPeriod && (
          <button
            onClick={() => navigate('/app/pedidos')}
            className="rounded-lg border border-blue-800 bg-gradient-to-r from-blue-900/50 to-blue-800/30 p-4 flex items-center gap-3 hover:border-blue-700 transition-colors"
            disabled={pendingOrders > 0}
            title={pendingOrders > 0 ? 'Você possui pedido pendente de aprovação. Aguarde antes de criar um novo pedido.' : ''}
          >
            <div className="text-2xl">✏️</div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-blue-200 text-sm">
                Novo Pedido
              </div>
              <div className="text-xs text-blue-300">
                {pendingOrders > 0 ? 'Aguarde aprovação do pedido anterior' : 'Criar pedido agora'}
              </div>
            </div>
          </button>
        )}

        {/* Pedidos Pendentes */}
        {pendingOrders > 0 && (
          <div className="rounded-lg border border-yellow-800 bg-gradient-to-r from-yellow-900/50 to-yellow-800/30 p-4 flex items-center gap-3">
            <div className="text-2xl">⏳</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-yellow-200 text-sm">
                {pendingOrders} pendente(s)
              </div>
              <div className="text-xs text-yellow-300">
                Aguardando aprovação
              </div>
            </div>
            <button
              onClick={() => navigate('/app/pedidos')}
              className="px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Ver
            </button>
          </div>
        )}

        {/* Pedidos Pagos */}
        {approvedOrders > 0 && (
          <div className="rounded-lg border border-blue-800 bg-gradient-to-r from-blue-900/50 to-blue-800/30 p-4 flex items-center gap-3">
            <div className="text-2xl">✅</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-blue-200 text-sm">
                {approvedOrders} pago(s)
              </div>
              <div className="text-xs text-blue-300">
                Em processamento
              </div>
            </div>
            <button
              onClick={() => navigate('/app/pedidos')}
              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Ver
            </button>
          </div>
        )}

        {/* Pedidos Entregues */}
        {deliveredOrders > 0 && (
          <div className="rounded-lg border border-green-800 bg-gradient-to-r from-green-900/50 to-green-800/30 p-4 flex items-center gap-3">
            <div className="text-2xl">📦</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-green-200 text-sm">
                {deliveredOrders} entregue(s)
              </div>
              <div className="text-xs text-green-300">
                Recebido com sucesso
              </div>
            </div>
            <button
              onClick={() => navigate('/app/pedidos')}
              className="px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Ver
            </button>
          </div>
        )}
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
          <div className="text-sm text-slate-400">Total de Pedidos</div>
          <div className="mt-2 text-3xl font-bold text-emerald-400">{totalOrders}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
          <div className="text-sm text-slate-400">Pendentes</div>
          <div className="mt-2 text-3xl font-bold text-yellow-400">{pendingOrders}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
          <div className="text-sm text-slate-400">Pagos</div>
          <div className="mt-2 text-3xl font-bold text-blue-400">{approvedOrders}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
          <div className="text-sm text-slate-400">Entregues</div>
          <div className="mt-2 text-3xl font-bold text-green-400">{deliveredOrders}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
          <div className="text-sm text-slate-400">Valor Total</div>
          <div className="mt-2 text-2xl font-bold text-purple-400">
            {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          {previousPeriod && (
            <div className={`text-xs mt-2 ${valueVariation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {valueVariation >= 0 ? '↑' : '↓'} {Math.abs(valueVariation).toFixed(1)}% vs período anterior
            </div>
          )}
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Pedidos por Trimestre */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-semibold">Pedidos por Trimestre ({currentYear})</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trimesterOrders}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}
                labelStyle={{ color: '#f1f5f9' }}
                itemStyle={{ color: '#3b82f6' }}
                formatter={(value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              />
              <Bar dataKey="valor" fill="#3b82f6" name="Valor Total" label={{ position: 'top', fill: '#94a3b8', formatter: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }} background={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pedidos por Classe */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-semibold">Pedidos por Classe</h3>
          {ordersByClass.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-2">📊</div>
              <p>Nenhum dado disponível</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ordersByClass}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="quantidade" fill="#10b981" name="Quantidade" label={{ position: 'top', fill: '#94a3b8', fontWeight: 600, fontSize: 14 }} background={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>        
      </div>

      {/* Grid de Gráfico e Últimos Pedidos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 5 Revistas Mais Pedidas */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-semibold">Top 5 Revistas</h3>
          {ordersByMagazine.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">🏆</div>
              <p>Sem dados disponíveis</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...ordersByMagazine]
                .sort((a, b) => b.quantidade - a.quantidade)
                .slice(0, 5)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-400">#{idx + 1}</span>
                      <span className="text-slate-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-400">{item.quantidade} un.</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Últimos Pedidos */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Últimos Pedidos</h3>
            <button
              onClick={() => navigate('/app/pedidos')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Ver todos →
            </button>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-2">📋</div>
              <p>Nenhum pedido realizado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded border border-slate-800 bg-slate-950 p-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        Pedido #{order.number ? String(order.number).padStart(4, '0') : order.id?.slice(0, 8)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)} unidades • {Number((order.items || []).reduce((sum, item) => sum + Number(item.totalValue || 0), 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 ${
                      order.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-300' :
                      order.status === 'APPROVED' ? 'bg-blue-900/50 text-blue-300' :
                      order.status === 'DELIVERED' ? 'bg-green-900/50 text-green-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {statusPT[order.status]}
                    </span>
                  </div>
                  
                  {/* Ações Rápidas */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                    <button
                      onClick={() => navigate(`/app/pedidos`)}
                      className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                      title="Ver detalhes do pedido"
                    >
                      👁️ Ver
                    </button>
                    <button
                      onClick={() => duplicateOrderMutation.mutate(order)}
                      disabled={duplicateOrderMutation.isPending || !currentPeriod}
                      className={`flex-1 text-xs px-2 py-1 rounded transition-colors ${
                        currentPeriod 
                          ? 'bg-emerald-600 hover:bg-emerald-700' 
                          : 'bg-slate-700 cursor-not-allowed'
                      } ${duplicateOrderMutation.isPending ? 'opacity-50' : ''}`}
                      title={!currentPeriod ? 'Nenhum período aberto para duplicar' : 'Duplicar este pedido'}
                    >
                      📋 Repetir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <button
          onClick={() => navigate('/app/pedidos')}
          className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-left hover:border-slate-700 transition-colors"
        >
          <div className="text-3xl mb-3">📝</div>
          <div className="font-semibold mb-1">Novo Pedido</div>
          <div className="text-sm text-slate-400">Criar um novo pedido</div>
        </button>

        {recentOrders.length > 0 && (
          <button
            onClick={() => duplicateOrderMutation.mutate(recentOrders[0])}
            disabled={duplicateOrderMutation.isPending || !currentPeriod || pendingOrders > 0}
            className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-left hover:border-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !currentPeriod
                ? 'Nenhum período aberto'
                : pendingOrders > 0
                  ? 'Você possui pedido pendente de aprovação. Aguarde antes de duplicar um pedido.'
                  : 'Duplicar o último pedido'
            }
          >
            <div className="text-3xl mb-3">📋</div>
            <div className="font-semibold mb-1">Duplicar Pedido</div>
            <div className="text-sm text-slate-400">{
              duplicateOrderMutation.isPending
                ? 'Duplicando...'
                : pendingOrders > 0
                  ? 'Aguarde aprovação do pedido anterior'
                  : 'Repetir último pedido'
            }</div>
          </button>
        )}
        
        <button
          onClick={() => navigate('/app/relatorios')}
          className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-left hover:border-slate-700 transition-colors"
        >
          <div className="text-3xl mb-3">📊</div>
          <div className="font-semibold mb-1">Relatórios</div>
          <div className="text-sm text-slate-400">Consulte relatórios e histórico</div>
        </button>
        
        <button
          onClick={() => navigate('/app/revistas')}
          className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-left hover:border-slate-700 transition-colors"
        >
          <div className="text-3xl mb-3">📚</div>
          <div className="font-semibold mb-1">Revistas</div>
          <div className="text-sm text-slate-400">Veja revistas disponíveis</div>
        </button>
      </div>
    </div>
  );
}
