import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import OccurrenceForm from './components/OccurrenceForm';
import PdfPreviewModal from './components/PdfPreviewModal';
import Toast from './components/Toast';
import { generateOccurrencePDF } from './utils/pdfGenerator';
import { ShieldCheck, FileCheck } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  
  // PDF Preview State
  const [previewPdfData, setPreviewPdfData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    teacherName: '',
    studentName: '',
    grade: '',
    occurrenceType: '',
    dateTime: '',
    description: '',
    coordinationEmail: 'Coordenação Pedagógica PEI'
  });

  // Inicializar data/hora atual no formato PT-BR
  useEffect(() => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setFormData(prev => ({
      ...prev,
      dateTime: `${formattedDate} às ${formattedTime}`
    }));
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

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
  const handlePreviewPdf = () => {
    if (!validateForm()) return;

    try {
      setIsGenerating(true);
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
  const handleDownloadPdf = () => {
    if (!validateForm()) return;

    try {
      setIsGenerating(true);
      const pdf = generateOccurrencePDF(formData);
      pdf.download();

      // Celebração visual de arquivo pronto
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast('Ocorrência em PDF gerada e baixada com sucesso!');

      // Limpa dados de entrada mantendo o nome do professor
      setFormData(prev => ({
        ...prev,
        studentName: '',
        description: ''
      }));
    } catch (err) {
      console.error(err);
      showToast('Falha ao baixar o documento PDF.', 'error');
    } finally {
      setIsGenerating(false);
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
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Geração instantânea de documento PDF oficial pronto para compartilhamento e impressão.
              </p>
            </div>
          </div>
          <div className="badge badge-info" style={{ padding: '6px 12px' }}>
            <FileCheck size={14} /> PDF Oficial Formatado
          </div>
        </div>

        {/* Formulário */}
        <OccurrenceForm
          formData={formData}
          onChange={handleInputChange}
          onPreview={handlePreviewPdf}
          onDownload={handleDownloadPdf}
          isGenerating={isGenerating}
        />
      </main>

      {/* Modal de Pré-visualização do PDF */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfData={previewPdfData}
        onDownload={handleDownloadPdf}
      />

      {/* Toast Feedback Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
