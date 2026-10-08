import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border transition-all transform translate-y-0 ${
              isError
                ? 'bg-error-container border-error text-on-error-container'
                : isSuccess
                ? 'bg-surface-container-lowest border-emerald-500 text-on-surface'
                : 'bg-surface-container-lowest border-outline-variant text-on-surface'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span
                  className={`material-symbols-outlined text-xl mt-0.5 ${
                    isError
                      ? 'text-error'
                      : isSuccess
                      ? 'text-emerald-600'
                      : 'text-secondary'
                  }`}
                >
                  {isError ? 'error' : isSuccess ? 'check_circle' : 'info'}
                </span>
                <div className="flex flex-col">
                  {toast.title && (
                    <span className="font-label-prominent text-sm font-bold leading-tight">
                      {toast.title}
                    </span>
                  )}
                  <p className="font-body-sm text-xs mt-0.5 leading-snug">
                    {toast.message}
                  </p>

                  {/* Reasons list for eligibility or validation errors */}
                  {toast.reasons && toast.reasons.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-xs space-y-1 font-medium text-error">
                      {toast.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
