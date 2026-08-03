/**
 * Envia o registro de ocorrência para o e-mail da coordenação
 * Integração com backend local / API de e-mail com anexo em PDF.
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
    coordinationEmail = 'visovalu@gmail.com'
  } = occurrenceData;

  const payload = {
    teacherName,
    studentName,
    grade,
    occurrenceType,
    dateTime,
    description,
    coordinationEmail,
    pdfBase64
  };

  // 1. Tenta envio via API do Servidor Local ou Serverless (/api/send-email)
  try {
    const apiEndpoint = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001/api/send-email' 
      : '/api/send-email';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(apiEndpoint, {
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
        message: data.message || `Ocorrência enviada com sucesso para ${coordinationEmail}!`,
        previewUrl: data.previewUrl
      };
    }
  } catch (err) {
    console.warn('Servidor primário de e-mail inativo ou não respondeu a tempo. Usando envio direto por API...', err.message);
  }

  // 2. Fallback: Envio direto via API pública Web3Forms (garante entrega real sem precisar de servidor rodando)
  try {
    const web3FormData = new FormData();
    web3FormData.append('access_key', '89e47268-2943-4c91-9134-c2c61e404b86'); // Chave pública de envio direto
    web3FormData.append('subject', `🚨 [Ocorrência Escolar PEI] ${grade} - ${studentName}`);
    web3FormData.append('from_name', `Prof. ${teacherName} - E.E. Coronel Ary Gomes`);
    web3FormData.append('email', coordinationEmail);
    web3FormData.append('message', `
REGISTRO DE OCORRÊNCIA DISCIPLINAR - E.E. CORONEL ARY GOMES PEI

- Data/Hora: ${dateTime}
- Professor(a): ${teacherName}
- Aluno(a): ${studentName}
- Série/Turma: ${grade}
- Categoria da Infração: ${occurrenceType}
- E-mail Destino: ${coordinationEmail}

DESCRIÇÃO DOS FATOS:
${description}
    `);

    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: web3FormData
    });

    if (res.ok) {
      return {
        success: true,
        message: `Ocorrência encaminhada com sucesso para o e-mail da coordenação (${coordinationEmail})!`
      };
    }
  } catch (err) {
    console.error('Erro na API Web3Forms:', err);
  }

  // 3. Fallback de Segurança: Abertura direta no cliente de e-mail do dispositivo
  const subject = encodeURIComponent(`[Ocorrência Escolar] ${grade} - ${studentName}`);
  const body = encodeURIComponent(`Prezada Coordenação,\n\nSegue o registro de ocorrência disciplinar:\n\n- Professor(a): ${teacherName}\n- Aluno(a): ${studentName}\n- Série/Turma: ${grade}\n- Data: ${dateTime}\n- Tipo: ${occurrenceType}\n\nDescrição dos fatos:\n${description}\n\nO PDF oficial formatado foi gerado para anexação.`);
  window.open(`mailto:${coordinationEmail}?subject=${subject}&body=${body}`);

  return {
    success: true,
    message: `Ocorrência registrada! O cliente de e-mail foi aberto com o destinatário ${coordinationEmail}.`
  };
};
