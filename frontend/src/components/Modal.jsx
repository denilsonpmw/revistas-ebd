import React from 'react';

/**
 * Componente Modal reutilizável para confirmações e avisos
 * Funciona tanto em mobile quanto desktop
 */
export const Modal = ({
  isOpen,
  title,
  message,
  type = 'warning', // 'warning', 'error', 'success', 'info', 'confirmation'
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDangerous = false, // Para ações destrutivas (delete, logout)
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'error':
        return {
          border: 'border-red-600/30',
          title: 'text-red-400',
          icon: 'text-red-400',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'success':
        return {
          border: 'border-emerald-600/30',
          title: 'text-emerald-400',
          icon: 'text-emerald-400',
          button: 'bg-emerald-600 hover:bg-emerald-700'
        };
      case 'info':
        return {
          border: 'border-blue-600/30',
          title: 'text-blue-400',
          icon: 'text-blue-400',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'confirmation':
        return {
          border: 'border-slate-600/30',
          title: 'text-slate-200',
          icon: 'text-slate-400',
          button: isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
        };
      default: // warning
        return {
          border: 'border-yellow-600/30',
          title: 'text-yellow-400',
          icon: 'text-yellow-400',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6V9m0 4V7m0 4v2m0-6h0" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'confirmation':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default: // warning
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6V9m0 4V7m0 4v2m0-6h0" />
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={2} />
          </svg>
        );
    }
  };

  const colors = getColors();

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-scale-in">
        <div className={`
          w-full max-w-sm bg-slate-900 rounded-lg border ${colors.border}
          shadow-2xl overflow-hidden
        `}>
          {/* Header */}
          <div className="bg-slate-800 px-6 py-4 flex items-start gap-4">
            <div className={`flex-shrink-0 ${colors.icon} mt-0.5`}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-lg ${colors.title}`}>
                {title}
              </h3>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="bg-slate-800 px-6 py-4 flex gap-3 justify-end border-t border-slate-700">
            <button
              onClick={onCancel}
              className="
                px-4 py-2 rounded-lg
                bg-slate-700 hover:bg-slate-600
                text-slate-100 hover:text-white
                transition-all duration-200
                font-medium text-sm
                min-h-[44px] flex items-center justify-center
              "
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`
                px-4 py-2 rounded-lg
                ${colors.button}
                text-white
                transition-all duration-200
                font-medium text-sm
                min-h-[44px] flex items-center justify-center
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Componente Alert reutilizável para avisos simples (sem confirmação)
 */
export const Alert = ({
  isOpen,
  title,
  message,
  type = 'warning',
  buttonText = 'OK',
  onClose,
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'error':
        return {
          border: 'border-red-600/30',
          title: 'text-red-400',
          icon: 'text-red-400',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'success':
        return {
          border: 'border-emerald-600/30',
          title: 'text-emerald-400',
          icon: 'text-emerald-400',
          button: 'bg-emerald-600 hover:bg-emerald-700'
        };
      case 'info':
        return {
          border: 'border-blue-600/30',
          title: 'text-blue-400',
          icon: 'text-blue-400',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      default: // warning
        return {
          border: 'border-yellow-600/30',
          title: 'text-yellow-400',
          icon: 'text-yellow-400',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default: // warning
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6V9m0 4V7m0 4v2m0-6h0" />
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={2} />
          </svg>
        );
    }
  };

  const colors = getColors();

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-scale-in">
        <div className={`
          w-full max-w-sm bg-slate-900 rounded-lg border ${colors.border}
          shadow-2xl overflow-hidden
        `}>
          {/* Header */}
          <div className="bg-slate-800 px-6 py-4 flex items-start gap-4">
            <div className={`flex-shrink-0 ${colors.icon} mt-0.5`}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-lg ${colors.title}`}>
                {title}
              </h3>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="bg-slate-800 px-6 py-4 flex justify-end border-t border-slate-700">
            <button
              onClick={onClose}
              className={`
                px-4 py-2 rounded-lg
                ${colors.button}
                text-white
                transition-all duration-200
                font-medium text-sm
                min-h-[44px] flex items-center justify-center
              `}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
