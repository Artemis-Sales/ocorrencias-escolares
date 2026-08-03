import React from 'react';
import { X, Download, FileText, Send } from 'lucide-react';

export default function PdfPreviewModal({ isOpen, onClose, pdfData, onDownload, onSendEmail, isSendingEmail }) {
  if (!isOpen || !pdfData) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '85vh' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={22} color="#6366f1" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Pré-visualização do Documento PDF</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* PDF Viewer Frame */}
        <div style={{ flex: 1, background: '#525659', borderRadius: '12px', overflow: 'hidden', minHeight: '350px' }}>
          <iframe
            src={pdfData.base64}
            title="Pré-visualização da Ocorrência PDF"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>

        {/* Modal Footer Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Fechar
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                onSendEmail();
                onClose();
              }}
              disabled={isSendingEmail}
              className="btn btn-secondary"
              style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
            >
              <Send size={18} color="#34d399" />
              {isSendingEmail ? 'Enviando...' : 'Enviar p/ Coordenação'}
            </button>

            <button
              onClick={() => {
                onDownload();
                onClose();
              }}
              className="btn btn-primary"
            >
              <Download size={18} />
              Baixar PDF Formatado
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
