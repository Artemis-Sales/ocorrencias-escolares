import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isInfo = toast.type === 'info';

  // Mapeamento de estilos por tipo de toast
  const styles = {
    success: {
      background: '#064e3b',
      color: '#6ee7b7',
      border: '1px solid #059669',
      icon: <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
    },
    info: {
      background: '#1e3a5f',
      color: '#93c5fd',
      border: '1px solid #3b82f6',
      icon: <Info size={22} style={{ flexShrink: 0 }} />
    },
    error: {
      background: '#7f1d1d',
      color: '#fca5a5',
      border: '1px solid #dc2626',
      icon: <AlertCircle size={22} style={{ flexShrink: 0 }} />
    }
  };

  const currentStyle = styles[toast.type] || styles.error;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        borderRadius: '14px',
        background: currentStyle.background,
        color: currentStyle.color,
        border: currentStyle.border,
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        maxWidth: '450px'
      }}
    >
      {currentStyle.icon}
      <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
        {toast.message}
      </div>
      <button
        onClick={onClose}
        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.8, flexShrink: 0 }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
