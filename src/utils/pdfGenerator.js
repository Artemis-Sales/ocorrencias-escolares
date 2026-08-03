import jsPDF from 'jspdf';
import { LOGO_SP_BASE64, LOGO_ARY_BASE64 } from '../assets/logos.js';

/**
 * Gera um documento PDF oficial de Ocorrência Escolar para a E.E. Coronel Ary Gomes
 * Layout moderno, sem sobreposição de texto e com alta legibilidade.
 * Baseado no modelo oficial exemplo.docx / exemplo.pdf
 * @param {Object} data - Dados da ocorrência
 * @returns {Object} { doc, blob, base64, filename, download }
 */
export const generateOccurrencePDF = (data) => {
  const {
    teacherName = '',
    studentName = '',
    grade = '',
    occurrenceType = '',
    dateTime = '',
    description = '',
    coordinationEmail = ''
  } = data;

  const JsPDFClass = jsPDF.jsPDF || jsPDF;
  const doc = new JsPDFClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2); // 178mm
  let y = 12;

  // --- 1. CABEÇALHO OFICIAL DO GOVERNO SP & ESCOLA (BASEADO NO EXEMPLO.DOCX) ---
  
  // Borda decorativa superior (Linha em Azul Marinho do Estado)
  doc.setDrawColor(30, 58, 138); // #1e3a8a
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Logo SP (Esquerda) - Proporção ~4.05:1 (142x35)
  const spLogoWidth = 33;
  const spLogoHeight = 33 / 4.05; // ~8.15mm
  doc.addImage(LOGO_SP_BASE64, 'JPEG', margin, y + 2, spLogoWidth, spLogoHeight);

  // Logo Ary Gomes PEI (Direita) - Proporção 1:1 (105x105)
  const aryLogoSize = 16;
  const aryLogoX = pageWidth - margin - aryLogoSize;
  doc.addImage(LOGO_ARY_BASE64, 'JPEG', aryLogoX, y, aryLogoSize, aryLogoSize);

  // Textos Institucionais do Cabeçalho (Centralizado)
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('GOVERNO DO ESTADO DE SÃO PAULO', pageWidth / 2, y + 3.5, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('SECRETARIA DE ESTADO DA EDUCAÇÃO', pageWidth / 2, y + 7.5, { align: 'center' });
  doc.text('DIRETORIA DE ENSINO – REGIÃO DE GUARULHOS SUL', pageWidth / 2, y + 11, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138); // Azul Marinho Oficial
  doc.setFontSize(10);
  doc.text('E.E. CORONEL ARY GOMES', pageWidth / 2, y + 15.5, { align: 'center' });

  y += 21;

  // Linha sutil divisória
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // --- 2. TÍTULO DO DOCUMENTO (Banner Elegante) ---
  doc.setFillColor(238, 242, 255); // Indigo 50
  doc.setDrawColor(199, 210, 254); // Indigo 200
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'FD');

  doc.setTextColor(49, 46, 129); // Indigo 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('REGISTRO DE OCORRÊNCIA DISCIPLINAR', pageWidth / 2, y + 7.5, { align: 'center' });

  y += 18;

  // --- 3. GRID DE METADADOS (LAYOUT CARDS EMPILHADOS - ZERO SOBREPOSIÇÃO) ---
  // Função auxiliar para desenhar um card de metadado (Rótulo no topo em cinza, valor abaixo em negrito)
  const drawFieldCard = (x, currentY, width, height, label, value, isHighlight = false) => {
    // Fundo do card
    doc.setFillColor(isHighlight ? 254 : 248, isHighlight ? 242 : 250, isHighlight ? 242 : 252); // Vermelho bem claro se destaque
    doc.setDrawColor(isHighlight ? 254 : 226, isHighlight ? 202 : 232, isHighlight ? 202 : 240);
    doc.roundedRect(x, currentY, width, height, 1.5, 1.5, 'FD');

    // Rótulo (Label)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(isHighlight ? 153 : 100, isHighlight ? 27 : 116, isHighlight ? 27 : 139); // Red 800 ou Slate 500
    doc.text(label.toUpperCase(), x + 3.5, currentY + 4.5);

    // Valor (Value)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // Slate 900

    // Quebra o valor se for muito longo para o card
    const truncatedValue = doc.splitTextToSize(value || 'Não informado', width - 7);
    doc.text(truncatedValue[0] || '', x + 3.5, currentY + 9.5);
  };

  const gap = 4;
  const colHalfWidth = (contentWidth - gap) / 2; // 87mm cada coluna
  const cardHeight = 13;

  // LINHA 1: Data e Hora | Série / Turma
  drawFieldCard(margin, y, colHalfWidth, cardHeight, 'Data e Hora do Ocorrido', dateTime);
  drawFieldCard(margin + colHalfWidth + gap, y, colHalfWidth, cardHeight, 'Série / Turma do Aluno', grade);
  y += cardHeight + gap;

  // LINHA 2: Nome do Aluno | Gravidade / Categoria da Infração
  drawFieldCard(margin, y, colHalfWidth, cardHeight, 'Nome do Aluno', studentName);
  drawFieldCard(margin + colHalfWidth + gap, y, colHalfWidth, cardHeight, 'Categoria da Infração', occurrenceType, true);
  y += cardHeight + gap;

  // LINHA 3: Professor Solicitante | E-mail da Coordenação
  drawFieldCard(margin, y, colHalfWidth, cardHeight, 'Professor(a) Solicitante', teacherName);
  drawFieldCard(margin + colHalfWidth + gap, y, colHalfWidth, cardHeight, 'E-mail da Coordenação', coordinationEmail);
  y += cardHeight + gap + 4;

  // --- 4. DESCRIÇÃO DETALHADA DA OCORRÊNCIA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text('DESCRIÇÃO DETALHADA DOS FATOS:', margin, y);
  y += 4;

  const descBoxHeight = 105;
  const lineSpacing = 5;
  const boxPadding = 4;
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Divide o texto em linhas ajustadas à largura da caixa
  const lines = doc.splitTextToSize(description || 'Nenhuma descrição detalhada informada.', contentWidth - 8);
  
  // Calcula se o texto cabe na caixa de descrição padrão
  const maxLinesPerBox = Math.floor((descBoxHeight - 13) / lineSpacing);
  const needsOverflow = lines.length > maxLinesPerBox;

  // Desenha a caixa de descrição (primeira página)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.roundedRect(margin, y, contentWidth, descBoxHeight, 2, 2, 'FD');

  let lineY = y + 7;
  let lineIndex = 0;

  // Renderiza linhas que cabem na primeira caixa
  while (lineIndex < lines.length && lineY < y + descBoxHeight - 6) {
    doc.text(lines[lineIndex], margin + boxPadding, lineY);
    lineY += lineSpacing;
    lineIndex++;
  }

  y += descBoxHeight;

  // Se há mais linhas, continua em novas páginas
  if (lineIndex < lines.length) {
    while (lineIndex < lines.length) {
      doc.addPage();
      y = 16;

      // Cabeçalho de continuação na nova página
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('DESCRIÇÃO DETALHADA DOS FATOS (Continuação)', margin, y);
      y += 5;

      // Caixa de continuação (usa quase toda a página)
      const contBoxHeight = pageHeight - y - 30;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, contBoxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);

      lineY = y + 7;
      while (lineIndex < lines.length && lineY < y + contBoxHeight - 6) {
        doc.text(lines[lineIndex], margin + boxPadding, lineY);
        lineY += lineSpacing;
        lineIndex++;
      }

      y += contBoxHeight;
    }
  }

  y += 16;


  // --- 5. CAMPO DE ASSINATURAS ---
  const sigWidth = 72;
  const sig1X = margin + 6;
  const sig2X = pageWidth - margin - sigWidth - 6;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(sig1X, y, sig1X + sigWidth, y);
  doc.line(sig2X, y, sig2X + sigWidth, y);

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Assinatura do(a) Professor(a)', sig1X + (sigWidth / 2), y, { align: 'center' });
  doc.text('Visto e Ciente da Coordenação', sig2X + (sigWidth / 2), y, { align: 'center' });

  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(teacherName || 'Professor(a)', sig1X + (sigWidth / 2), y, { align: 'center' });
  doc.text('E.E. Coronel Ary Gomes', sig2X + (sigWidth / 2), y, { align: 'center' });

  // --- 6. RODAPÉ DO DOCUMENTO ---
  const footerY = doc.internal.pageSize.getHeight() - 8;
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Documento emitido pelo Sistema de Ocorrências Escolares PEI - Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, footerY, { align: 'center' });

  // Retornos
  const blob = doc.output('blob');
  const base64 = doc.output('datauristring');
  
  const sanitizedStudent = (studentName || 'Aluno').replace(/[^a-z0-9]/gi, '_');
  const filename = `Ocorrencia_${sanitizedStudent}_${new Date().toISOString().slice(0, 10)}.pdf`;

  return {
    doc,
    blob,
    base64,
    filename,
    download: () => doc.save(filename)
  };
};
