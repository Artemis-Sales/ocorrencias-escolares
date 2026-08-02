import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

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
        background: isSuccess ? '#064e3b' : '#7f1d1d',
        color: isSuccess ? '#6ee7b7' : '#fca5a5',
        border: `1px solid ${isSuccess ? '#059669' : '#dc2626'}`,
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        maxWidth: '450px'
      }}
    >
      {isSuccess ? <CheckCircle2 size={22} shrink={0} /> : <AlertCircle size={22} shrink={0} />}
      <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
        {toast.message}
      </div>
      <button
        onClick={onClose}
        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.8 }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
