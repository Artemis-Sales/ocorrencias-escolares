/**
 * Envia o registro de ocorrência para o e-mail da coordenação
 * Integração com API Serverless (Vercel) / Servidor Local Express com anexo PDF.
 * @param {Object} occurrenceData - Dados completos da ocorrência
 * @param {string} pdfBase64 - Conteúdo em base64 do PDF gerado
 * @returns {Promise<{success: boolean, message: string, previewUrl?: string}>}
 */
export const sendOccurrenceEmail = async (occurrenceData, pdfBase64) => {
  const {
    teacherName,
    studentName,
    grade,
    occurrenceType,
    dateTime,
    description,
    coordinationEmail = 'arygomescoord2026@gmail.com',
    teacherEmail = ''
  } = occurrenceData;

  const payload = {
    teacherName,
    studentName,
    grade,
    occurrenceType,
    dateTime,
    description,
    coordinationEmail: coordinationEmail || 'arygomescoord2026@gmail.com',
    teacherEmail,
    pdfBase64
  };

  const targetEmail = coordinationEmail || 'arygomescoord2026@gmail.com';

  // 1. Tenta envio via API Principal (/api/send-email)
  const endpoints = ['/api/send-email'];
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    endpoints.push('http://localhost:3001/api/send-email');
  }

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 segundos timeout

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: data.message || `Ocorrência e documento PDF enviados com sucesso para ${targetEmail}!`,
          previewUrl: data.previewUrl
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn(`Endpoint ${endpoint} retornou status ${response.status}:`, errData);
      }
    } catch (err) {
      console.warn(`Tentativa em ${endpoint} falhou:`, err.message);
    }
  }

  // 2. Fallback: Envio via API pública Web3Forms
  try {
    const web3formsKey = import.meta.env.VITE_WEB3FORMS_KEY;

    if (web3formsKey) {
      const web3FormData = new FormData();
      web3FormData.append('access_key', web3formsKey);
      web3FormData.append('subject', `🚨 [Ocorrência Escolar PEI] ${grade} - ${studentName}`);
      web3FormData.append('from_name', `Prof. ${teacherName} - E.E. Coronel Ary Gomes`);
      web3FormData.append('email', targetEmail);
      if (teacherEmail) {
        web3FormData.append('replyto', teacherEmail);
      }
      web3FormData.append('message', `
REGISTRO DE OCORRÊNCIA DISCIPLINAR - E.E. CORONEL ARY GOMES PEI

- Data/Hora: ${dateTime}
- Professor(a): ${teacherName}
- Aluno(a): ${studentName}
- Série/Turma: ${grade}
- Categoria da Infração: ${occurrenceType}
- E-mail Destino: ${targetEmail}

DESCRIÇÃO DOS FATOS:
${description}

(Nota: O documento PDF formatado foi baixado no dispositivo do professor).
      `);

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: web3FormData
      });

      if (res.ok) {
        return {
          success: true,
          message: `Ocorrência encaminhada com sucesso para o e-mail da coordenação (${targetEmail})!`
        };
      }
    }
  } catch (err) {
    console.error('Erro no fallback Web3Forms:', err);
  }

  // 3. Fallback de Segurança: Abertura direta no cliente de e-mail do dispositivo
  const subject = encodeURIComponent(`[Ocorrência Escolar PEI] ${grade} - ${studentName}`);
  const body = encodeURIComponent(`Prezada Coordenação,\n\nSegue o registro de ocorrência disciplinar:\n\n- Professor(a): ${teacherName}\n- Aluno(a): ${studentName}\n- Série/Turma: ${grade}\n- Data: ${dateTime}\n- Tipo: ${occurrenceType}\n\nDescrição dos fatos:\n${description}\n\nO documento oficial em PDF foi gerado pelo sistema.`);
  window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`);

  return {
    success: true,
    message: `Ocorrência pronta! O cliente de e-mail foi aberto com o destinatário ${targetEmail}.`
  };
};
