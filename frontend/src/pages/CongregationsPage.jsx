
import React from 'react';
import CongregationManager from '../components/CongregationManager';

export default function CongregationsPage() {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 mx-auto mt-6 w-full">
      <h1 className="text-2xl font-bold mb-6 text-slate-100">Congregações</h1>
      <CongregationManager />
    </div>
  );
}
