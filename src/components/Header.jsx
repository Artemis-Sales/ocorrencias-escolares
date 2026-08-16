import React from 'react';
import { Shield, Moon, Sun, BookOpen } from 'lucide-react';
import logoAry from '../assets/logo-ary.jpg';

export default function Header({ theme, toggleTheme }) {
  return (
    <header className="glass-card" style={{ borderRadius: '0 0 20px 20px', borderTop: 'none', padding: '16px 24px', marginBottom: '32px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Logos & Escolas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src={logoAry} alt="Logo Ary Gomes" style={{ height: '42px', objectFit: 'contain', background: '#ffffff', padding: '2px', borderRadius: '6px' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                E.E. Coronel Ary Gomes
              </h1>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>PEI</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={12} color="#f59e0b" />
              Governo do Estado de SP &bull; Diretoria Guarulhos Sul
            </p>
          </div>
        </div>

        {/* Controles de Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
            <BookOpen size={14} color="#6366f1" />
            <span>Sistema de Ocorrências Escolares</span>
          </div>

          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            title="Alternar Tema Claro/Escuro"
            style={{ padding: '10px 14px', borderRadius: '12px' }}
          >
            {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
          </button>
        </div>

      </div>
    </header>
  );
}
