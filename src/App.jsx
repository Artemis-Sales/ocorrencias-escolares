import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import OccurrenceForm from './components/OccurrenceForm';
import PdfPreviewModal from './components/PdfPreviewModal';
import Toast from './components/Toast';
import { ShieldCheck, Mail } from 'lucide-react';

const DRAFT_STORAGE_KEY = 'ocorrencia_draft_v1';
const TEACHER_STORAGE_KEY = 'ocorrencia_teacher_name';

// Lazy imports para reduzir bundle inicial
const loadPdfGenerator = () => import('./utils/pdfGenerator').then(m => m.generateOccurrencePDF);
const loadEmailService = () => import('./utils/emailService').then(m => m.sendOccurrenceEmail);

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const draftTimerRef = useRef(null);
  
  // PDF Preview State
  const [previewPdfData, setPreviewPdfData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Form State com recuperação de rascunho
  const [formData, setFormData] = useState(() => {
    const savedTeacher = localStorage.getItem(TEACHER_STORAGE_KEY) || '';
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        return {
          teacherName: savedTeacher || parsed.teacherName || '',
          studentName: parsed.studentName || '',
          grade: parsed.grade || '',
          occurrenceType: parsed.occurrenceType || '',
          dateTime: parsed.dateTime || '',
          description: parsed.description || '',
          coordinationEmail: (!parsed.coordinationEmail || parsed.coordinationEmail === 'visovalu@gmail.com') 
            ? 'arygomescoord2026@gmail.com' 
            : parsed.coordinationEmail,
          teacherEmail: parsed.teacherEmail || ''
        };
      } catch (e) {
        // Fallback se json inválido
      }
    }

    return {
      teacherName: savedTeacher,
      studentName: '',
      grade: '',
      occurrenceType: '',
      dateTime: '',
      description: '',
      coordinationEmail: 'arygomescoord2026@gmail.com',
      teacherEmail: ''
    };
  });

  // Atualizar data/hora se não estiver preenchida no rascunho
  useEffect(() => {
    if (!formData.dateTime) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setFormData(prev => ({
        ...prev,
        dateTime: `${formattedDate} às ${formattedTime}`
      }));
    }
  }, []);

  // Auto-Save de Rascunho com debounce
  useEffect(() => {
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }

    draftTimerRef.current = setTimeout(() => {
      try {
        if (formData.teacherName) {
          localStorage.setItem(TEACHER_STORAGE_KEY, formData.teacherName);
        }
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        setIsDraftSaved(true);
      } catch (e) {
        console.warn('Erro ao salvar rascunho:', e);
      }
    }, 600);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [formData]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResetStudentFields = () => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setFormData(prev => ({
      ...prev,
      studentName: '',
      grade: '',
      occurrenceType: '',
      description: '',
      dateTime: `${formattedDate} às ${formattedTime}`
    }));

    showToast('Campos do aluno limpos. Nome do professor mantido.', 'info');
  };

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 6000);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const validateForm = () => {
    if (!formData.teacherName.trim()) {
      showToast('Por favor, informe seu nome como professor(a).', 'error');
      return false;
    }
    if (!formData.studentName.trim()) {
      showToast('Por favor, informe o nome do aluno.', 'error');
      return false;
    }
    if (!formData.grade) {
      showToast('Por favor, selecione a série/turma do aluno.', 'error');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.coordinationEmail || !emailRegex.test(formData.coordinationEmail)) {
      showToast('Por favor, informe um e-mail válido para a coordenação.', 'error');
      return false;
    }
    if (formData.teacherEmail && !emailRegex.test(formData.teacherEmail)) {
      showToast('O e-mail do professor informado para cópia não é válido.', 'error');
      return false;
    }
    if (!formData.occurrenceType) {
      showToast('Por favor, selecione o tipo de infração da ocorrência.', 'error');
      return false;
    }
    if (!formData.description.trim()) {
      showToast('Por favor, escreva a descrição detalhada da ocorrência.', 'error');
      return false;
    }
    return true;
  };

  // 1. Pré-visualizar PDF
  const handlePreviewPdf = async () => {
    if (!validateForm()) return;

    try {
      setIsGenerating(true);
      const generateOccurrencePDF = await loadPdfGenerator();
      const pdf = generateOccurrencePDF(formData);
      setPreviewPdfData(pdf);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar a pré-visualização do PDF.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Baixar PDF Oficial
  const handleDownloadPdf = async () => {
    if (!validateForm()) return;

    try {
      setIsGenerating(true);
      const generateOccurrencePDF = await loadPdfGenerator();
      const pdf = generateOccurrencePDF(formData);
      pdf.download();

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast('Ocorrência em PDF gerada e baixada com sucesso!');

      // Limpa formulário do aluno mantendo dados do professor
      handleResetStudentFields();
    } catch (err) {
      console.error(err);
      showToast('Falha ao baixar o documento PDF.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Enviar Ocorrência por E-mail E Baixar PDF Simultaneamente
  const handleSendEmail = async () => {
    if (!validateForm()) return;

    try {
      setIsSendingEmail(true);
      showToast('Processando envio direto para o e-mail da coordenação...', 'info');

      const [generateOccurrencePDF, sendOccurrenceEmail] = await Promise.all([
        loadPdfGenerator(),
        loadEmailService()
      ]);

      // 1. Gera PDF
      const pdf = generateOccurrencePDF(formData);

      // 2. Baixa uma cópia no dispositivo
      pdf.download();

      // 3. Dispara o e-mail com o anexo PDF
      const result = await sendOccurrenceEmail(formData, pdf.base64);

      if (result.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });

        const successMsg = `Sucesso! Ocorrência e PDF anexado enviados para ${formData.coordinationEmail}`;
        showToast(successMsg, 'success');

        if (result.previewUrl) {
          console.log(`🔗 Link de pré-visualização do e-mail de teste: ${result.previewUrl}`);
        }

        // Limpa campos variáveis do aluno mantendo professor
        handleResetStudentFields();
      } else {
        showToast(result.message || 'Falha ao enviar e-mail. Verifique a conexão.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Ocorreu uma falha durante o processo de envio.', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Cabeçalho */}
      <Header theme={theme} toggleTheme={toggleTheme} />

      {/* Conteúdo Principal */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Banner Informativo */}
        <div className="glass-card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={24} color="#34d399" />
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Gerador de Ocorrência Escolar PEI</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Envio direto para a coordenação (<strong style={{ color: '#34d399' }}>{formData.coordinationEmail}</strong>) com documento PDF oficial anexado.
              </p>
            </div>
          </div>
          <div className="badge badge-info" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail size={14} /> Envio Automático Habilitado
          </div>
        </div>

        {/* Formulário */}
        <OccurrenceForm
          formData={formData}
          onChange={handleInputChange}
          onResetStudentFields={handleResetStudentFields}
          onPreview={handlePreviewPdf}
          onDownload={handleDownloadPdf}
          onSendEmail={handleSendEmail}
          isGenerating={isGenerating}
          isSendingEmail={isSendingEmail}
          isDraftSaved={isDraftSaved}
        />
      </main>

      {/* Modal de Pré-visualização do PDF */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfData={previewPdfData}
        onDownload={handleDownloadPdf}
        onSendEmail={handleSendEmail}
        isSendingEmail={isSendingEmail}
      />

      {/* Toast Feedback Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
