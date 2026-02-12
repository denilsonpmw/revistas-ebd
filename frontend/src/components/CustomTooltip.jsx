import React from 'react';
import { formatCurrency } from '../utils/currency';

export default function CustomTooltip({ active, payload, label, quantityKey = 'revistas', valueKey = 'valor', theme = 'dark', showTotal = false, coordinate, labelValueIsCurrency = false }) {
  const tooltipRef = React.useRef(null);
  const [arrowPosition, setArrowPosition] = React.useState(50); // posição em porcentagem

  React.useEffect(() => {
    if (!active || !coordinate) return;
    
    // Pequeno delay para garantir que o tooltip está renderizado
    const timer = setTimeout(() => {
      if (tooltipRef.current && coordinate.x !== undefined) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const relativeX = coordinate.x - tooltipRect.left;
        const percentage = Math.max(10, Math.min(90, (relativeX / tooltipRect.width) * 100));
        setArrowPosition(percentage);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [coordinate, active]);

  if (!active || !payload || !payload.length) return null;

  // Detect theme (dark/light)
  const isDark = theme === 'dark';

  // Calcular totais
  const totalQuantity = showTotal ? payload.reduce((sum, entry) => sum + (entry.payload[quantityKey] || 0), 0) : 0;
  const totalValue = showTotal ? payload.reduce((sum, entry) => sum + (entry.payload[valueKey] || 0), 0) : 0;

  return (
    <div
      ref={tooltipRef}
      className={`rounded-lg shadow-xl border px-4 py-3 min-w-[200px] pointer-events-none ${
        isDark
          ? 'bg-slate-900 border-slate-700 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
      style={{ position: 'relative' }}
    >
      {/* Arrow */}
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          left: `${arrowPosition}%`,
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '10px solid #ef4444',
          transition: 'left 0.05s ease-out',
        }}
      />
      <div className="font-semibold mb-2 text-base">{label}</div>
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium" style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-mono font-semibold">
              {labelValueIsCurrency ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
      {showTotal && (
        <div className={`mt-2 pt-2 border-t space-y-1 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between gap-3 text-xs font-semibold">
            <span>Qtd. Total:</span>
            <span className="font-mono">{totalQuantity}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs font-semibold">
            <span>Valor Total:</span>
            <span className="font-mono">{formatCurrency(totalValue)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
