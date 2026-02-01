import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { apiRequest } from '../api/client';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardAdminPage() {
  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiRequest('/orders')
  });

  const magazinesQuery = useQuery({
    queryKey: ['magazines'],
    queryFn: () => apiRequest('/magazines?active=true')
  });

  const areasQuery = useQuery({
    queryKey: ['areas'],
    queryFn: () => apiRequest('/admin/areas')
  });

  const congregationsQuery = useQuery({
    queryKey: ['congregations'],
    queryFn: () => apiRequest('/admin/congregations')
  });

  const orders = ordersQuery.data?.orders || [];
  const magazines = magazinesQuery.data?.magazines || [];
  const areas = areasQuery.data?.areas || [];
  const congregations = congregationsQuery.data?.congregations || [];

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const approvedOrders = orders.filter(o => o.status === 'APPROVED').length;
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
  const totalCongregations = congregations.length;
  const totalValue = orders.reduce((sum, o) => sum + Number(o.totalValue || 0), 0);
  const totalQuantity = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);

  const ordersByStatus = [
    { name: 'Pendente', value: pendingOrders, color: '#f59e0b' },
    { name: 'Aprovado', value: approvedOrders, color: '#3b82f6' },
    { name: 'Entregue', value: deliveredOrders, color: '#10b981' },
    { name: 'Cancelado', value: orders.filter(o => o.status === 'CANCELED').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const magazineStats = magazines.map(mag => {
    const magOrders = orders.filter(o => o.magazineId === mag.id);
    return {
      name: mag.code,
      quantidade: magOrders.reduce((sum, o) => sum + o.quantity, 0),
      valor: magOrders.reduce((sum, o) => sum + Number(o.totalValue || 0), 0)
    };
  }).filter(item => item.quantidade > 0);

  const areaStats = areas.map(area => {
    const areaCongregations = congregations.filter(c => c.areaId === area.id);
    const areaOrders = orders.filter(o => areaCongregations.some(c => c.id === o.congregationId));
    return {
      name: area.name,
      pedidos: areaOrders.length,
      valor: areaOrders.reduce((sum, o) => sum + Number(o.totalValue || 0), 0)
    };
  });

  // Ordena por data crescente (mais antigo primeiro)
  const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const statusPT = {
    PENDING: 'Pendente',
    APPROVED: 'Pago',
    DELIVERED: 'Entregue',
    CANCELED: 'Cancelado'
  };

  if (ordersQuery.isLoading || magazinesQuery.isLoading) {
    return <div className="p-6">Carregando dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Dashboard Administrativo</h2>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
          <div className="text-sm text-slate-400">Igrejas</div>
          <div className="mt-2 text-3xl font-bold text-purple-400">{totalCongregations}</div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
          <div className="text-sm text-slate-400">Pedidos</div>
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
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-semibold">Pedidos por Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={ordersByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ordersByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-semibold">Pedidos por Área</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={areaStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Bar dataKey="pedidos" fill="#10b981" name="Pedidos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Revistas */}
      {magazineStats.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-semibold">Quantidade por Revista</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={magazineStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Bar dataKey="quantidade" fill="#3b82f6" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela de Todos os Pedidos */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <h3 className="mb-4 text-lg font-semibold">Todos os Pedidos</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-800">
              <tr>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Congregação</th>
                <th className="p-3 text-left">Período</th>
                <th className="p-3 text-left">Itens</th>
                <th className="p-3 text-left">Valor Total</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => {
                const totalValue = order.items?.reduce((sum, item) => sum + Number(item.totalValue || 0), 0) || 0;
                const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                return (
                  <tr key={order.id} className="border-t border-slate-800">
                    <td className="p-3">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">{order.congregation?.name}</td>
                    <td className="p-3">{order.period?.code || 'N/A'}</td>
                    <td className="p-3">{totalQuantity} revista(s)</td>
                    <td className="p-3">R$ {totalValue.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${
                        order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        order.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' :
                        order.status === 'DELIVERED' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {statusPT[order.status] || order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
