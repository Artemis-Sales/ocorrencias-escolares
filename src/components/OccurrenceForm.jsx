import React, { useState } from 'react';
import { UserCheck, Users, Calendar, AlertTriangle, FileText, Eye, Download, PlusCircle, Sparkles, Mail, Send } from 'lucide-react';

export default function OccurrenceForm({
  formData,
  onChange,
  onPreview,
  onDownload,
  onSendEmail,
  isGenerating,
  isSendingEmail
}) {
  const [activeChip, setActiveChip] = useState('');

  // Sugestões de textos rápidos de ocorrência para auxiliar o professor
  const quickTemplates = [
    "Uso indevido de aparelho celular durante o momento de explicação da aula.",
    "Comportamento indisciplinado e conversas paralelas excessivas atrapalhando a turma.",
    "Falta de respeito e uso de linguagem inadequada com colegas de sala.",
    "Recusa repetida em realizar as atividades propostas pelo professor em sala.",
    "Saída da sala de aula sem a prévia autorização do professor."
  ];

  const handleAddTemplate = (text) => {
    const newDescription = formData.description
      ? `${formData.description}\n- ${text}`
      : `- ${text}`;

    onChange({
      target: {
        name: 'description',
        value: newDescription
      }
    });
    setActiveChip(text);
    setTimeout(() => setActiveChip(''), 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onDownload();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '850px', margin: '0 auto' }}>
      
      {/* Título da Seção */}
      <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Sparkles size={24} color="#6366f1" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Novo Registro de Ocorrência Escolar</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Preencha os campos abaixo para gerar o PDF oficial e enviar o registro diretamente para a coordenação.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Campo: Nome do Professor */}
        <div className="form-group">
          <label className="form-label" htmlFor="teacherName">
            <UserCheck size={18} color="#6366f1" />
            Nome do(a) Professor(a) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="teacherName"
            name="teacherName"
            type="text"
            required
            className="form-input"
            placeholder="Ex: Prof. Roberto Silva"
            value={formData.teacherName}
            onChange={onChange}
          />
        </div>

        {/* Campo: Nome do Aluno */}
        <div className="form-group">
          <label className="form-label" htmlFor="studentName">
            <Users size={18} color="#6366f1" />
            Nome do(a) Aluno(a) <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="studentName"
            name="studentName"
            type="text"
            required
            className="form-input"
            placeholder="Ex: Gabriel Lucas Santos"
            value={formData.studentName}
            onChange={onChange}
          />
        </div>

        {/* Campo: Série / Turma */}
        <div className="form-group">
          <label className="form-label" htmlFor="grade">
            <Sparkles size={18} color="#6366f1" />
            Série / Turma <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            id="grade"
            name="grade"
            required
            className="form-select"
            value={formData.grade}
            onChange={onChange}
          >
            <option value="">Selecione a série do aluno...</option>
            <optgroup label="Ensino Fundamental II">
              <option value="6º Ano A">6º Ano A</option>
              <option value="6º Ano B">6º Ano B</option>
              <option value="7º Ano A">7º Ano A</option>
              <option value="7º Ano B">7º Ano B</option>
              <option value="8º Ano A">8º Ano A</option>
              <option value="8º Ano B">8º Ano B</option>
              <option value="9º Ano A">9º Ano A</option>
              <option value="9º Ano B">9º Ano B</option>
            </optgroup>
            <optgroup label="Ensino Médio">
              <option value="1º Ano EM A">1º Ano EM A</option>
              <option value="1º Ano EM B">1º Ano EM B</option>
              <option value="2º Ano EM A">2º Ano EM A</option>
              <option value="2º Ano EM B">2º Ano EM B</option>
              <option value="3º Ano EM A">3º Ano EM A</option>
              <option value="3º Ano EM B">3º Ano EM B</option>
            </optgroup>
            <option value="Outra Turma">Outra Turma</option>
          </select>
        </div>

        {/* Campo: Data e Hora */}
        <div className="form-group">
          <label className="form-label" htmlFor="dateTime">
            <Calendar size={18} color="#6366f1" />
            Data e Hora do Ocorrido <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="dateTime"
            name="dateTime"
            type="text"
            required
            className="form-input"
            placeholder="DD/MM/AAAA - HH:mm"
            value={formData.dateTime}
            onChange={onChange}
          />
        </div>

      </div>

      {/* Campo: E-mail da Coordenação e Categoria */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Campo: Categoria da Ocorrência */}
        <div className="form-group">
          <label className="form-label" htmlFor="occurrenceType">
            <AlertTriangle size={18} color="#f59e0b" />
            Tipo / Categoria da Infração <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            id="occurrenceType"
            name="occurrenceType"
            required
            className="form-select"
            value={formData.occurrenceType}
            onChange={onChange}
          >
            <option value="">Selecione o tipo da infração...</option>
            <option value="Indisciplina / Perturbação da Aula">Indisciplina / Perturbação da Aula</option>
            <option value="Uso Indevido de Aparelho Celular / Eletrônicos">Uso Indevido de Aparelho Celular / Eletrônicos</option>
            <option value="Desrespeito às Regras da Escola ou Funcionários">Desrespeito às Regras da Escola ou Funcionários</option>
            <option value="Faltas ou Atrasos Recorrentes">Faltas ou Atrasos Recorrentes</option>
            <option value="Agressão Verbal ou Desentendimento entre Alunos">Agressão Verbal ou Desentendimento entre Alunos</option>
            <option value="Danos ao Patrimônio Escolar">Danos ao Patrimônio Escolar</option>
            <option value="Outro Motivo Disciplinar">Outro Motivo Disciplinar</option>
          </select>
        </div>

        {/* Campo: E-mail Destinatário da Coordenação */}
        <div className="form-group">
          <label className="form-label" htmlFor="coordinationEmail">
            <Mail size={18} color="#10b981" />
            E-mail da Coordenação / Destino <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="coordinationEmail"
            name="coordinationEmail"
            type="email"
            required
            className="form-input"
            placeholder="Ex: arygomescoord2026@gmail.com ou coordenacao@escola.sp.gov.br"
            value={formData.coordinationEmail}
            onChange={onChange}
          />
        </div>

      </div>

      {/* Campo: Descrição Detalhada */}
      <div className="form-group" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="form-label" htmlFor="description">
            <FileText size={18} color="#6366f1" />
            Descrição Detalhada do Ocorrido <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {formData.description.length} caracteres
          </span>
        </div>

        <textarea
          id="description"
          name="description"
          required
          rows={5}
          className="form-textarea"
          placeholder="Descreva de forma clara e objetiva a conduta do aluno que violou a regra da escola..."
          value={formData.description}
          onChange={onChange}
          style={{ resize: 'vertical', minHeight: '120px' }}
        />

        {/* Templates rápidos */}
        <div style={{ marginTop: '10px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            Inserção rápida de motivos comuns:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {quickTemplates.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddTemplate(tmpl)}
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: activeChip === tmpl ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <PlusCircle size={12} color="#6366f1" />
                {tmpl.slice(0, 38)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Botões de Ação Principais */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
        
        <button
          type="button"
          onClick={onPreview}
          disabled={isGenerating || isSendingEmail}
          className="btn btn-secondary"
          style={{ padding: '14px 20px' }}
        >
          <Eye size={18} color="#818cf8" />
          Visualizar PDF
        </button>

        <button
          type="button"
          onClick={onSendEmail}
          disabled={isGenerating || isSendingEmail}
          className="btn btn-secondary"
          style={{ padding: '14px 20px', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
        >
          <Send size={18} color="#34d399" />
          {isSendingEmail ? 'Enviando e Baixando...' : 'Enviar por E-mail e Baixar PDF'}
        </button>

        <button
          type="submit"
          disabled={isGenerating || isSendingEmail}
          className="btn btn-primary"
          style={{ padding: '14px 24px', fontSize: '1rem' }}
        >
          <Download size={18} />
          {isGenerating ? 'Gerando PDF...' : 'Gerar e Baixar PDF'}
        </button>

      </div>

    </form>
  );
}
