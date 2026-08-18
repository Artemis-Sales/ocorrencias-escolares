import nodemailer from 'nodemailer';

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeHeader(text, maxLen = 120) {
  if (typeof text !== 'string') return '';
  return text.replace(/[\r\n\t]/g, ' ').trim().slice(0, maxLen);
}

export default async function handler(req, res) {
  // Cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Diagnóstico GET para verificar se a API está online na Vercel
  if (req.method === 'GET') {
    const hasSmtpPass = Boolean(process.env.SMTP_PASS);
    const smtpUser = process.env.SMTP_USER || 'arygomescoord2026@gmail.com';
    return res.status(200).json({
      status: 'API Vercel Online',
      smtpUser,
      hasSmtpPass,
      message: hasSmtpPass 
        ? 'Configuração SMTP ativa na Vercel.' 
        : 'ATENÇÃO: SMTP_PASS não configurada nas Environment Variables da Vercel.'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido. Use POST.' });
  }

  try {
    // Garante compatibilidade caso o body venha como string ou objeto na Vercel
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Formato JSON inválido no corpo da requisição.' });
      }
    }
    body = body || {};

    const {
      teacherName,
      studentName,
      grade,
      occurrenceType,
      dateTime,
      description,
      coordinationEmail = 'arygomescoord2026@gmail.com',
      teacherEmail = '',
      pdfBase64
    } = body;

    if (!teacherName || !studentName || !grade || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados da ocorrência incompletos. Preencha todos os campos obrigatórios.' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanCoordinationEmail = sanitizeHeader(coordinationEmail, 100);
    if (!emailRegex.test(cleanCoordinationEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Endereço de e-mail da coordenação inválido.' 
      });
    }

    const cleanTeacherEmail = teacherEmail ? sanitizeHeader(teacherEmail, 100) : '';
    if (cleanTeacherEmail && !emailRegex.test(cleanTeacherEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Endereço de e-mail do professor inválido.' 
      });
    }

    // Sanitização contra CRLF e XSS
    const safeTeacherName = escapeHtml(sanitizeHeader(teacherName, 120));
    const safeStudentName = escapeHtml(sanitizeHeader(studentName, 120));
    const safeGrade = escapeHtml(sanitizeHeader(grade, 50));
    const safeOccurrenceType = escapeHtml(sanitizeHeader(occurrenceType, 120));
    const safeDateTime = escapeHtml(sanitizeHeader(dateTime, 60));
    const safeDescription = escapeHtml(typeof description === 'string' ? description.slice(0, 15000) : '');

    let transporter;
    let senderEmail = process.env.SMTP_USER || 'arygomescoord2026@gmail.com';

    const rawPass = process.env.SMTP_PASS || '';
    const cleanPass = rawPass.replace(/\s+/g, '');

    if (!cleanPass) {
      return res.status(500).json({
        success: false,
        message: 'Variável de ambiente SMTP_PASS não configurada no painel da Vercel. Adicione a senha de aplicativo nas configurações do projeto na Vercel.'
      });
    }

    const user = process.env.SMTP_USER || 'arygomescoord2026@gmail.com';
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const isGmail = host.includes('gmail');

    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user,
          pass: cleanPass
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        host: host,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE !== 'false',
        auth: {
          user: user,
          pass: cleanPass
        }
      });
    }
    senderEmail = user;

    const base64Data = pdfBase64 
      ? (pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64) 
      : null;
    const pdfBuffer = base64Data ? Buffer.from(base64Data, 'base64') : null;

    const sanitizedStudentFile = studentName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
    const attachmentFilename = `Ocorrencia_${sanitizedStudentFile}_${new Date().toISOString().slice(0, 10)}.pdf`;

    const mailOptions = {
      from: `"E.E. Coronel Ary Gomes - Ocorrências" <${senderEmail}>`,
      to: cleanCoordinationEmail,
      cc: cleanTeacherEmail ? cleanTeacherEmail : undefined,
      subject: `🚨 [Ocorrência Escolar PEI] ${safeGrade} - ${safeStudentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
          <div style="background: #1e3a8a; color: #ffffff; padding: 22px 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">E.E. CORONEL ARY GOMES - PEI</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Governo do Estado de São Paulo • Secretaria da Educação</p>
          </div>
          
          <div style="padding: 26px; color: #0f172a;">
            <h3 style="color: #1e3a8a; margin-top: 0; font-size: 18px;">📋 Novo Registro de Ocorrência Escolar</h3>
            <p style="font-size: 14px; line-height: 1.5; color: #334155;">
              Prezada Coordenação Pedagógica,<br/>
              Um novo registro de ocorrência disciplinar foi emitido e enviado diretamente pelo portal de ocorrências.
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: bold; width: 35%; color: #475569;">Data / Hora:</td>
                <td style="padding: 10px 14px; color: #0f172a;">${safeDateTime}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: bold; color: #475569;">Aluno(a):</td>
                <td style="padding: 10px 14px; font-weight: bold; color: #0f172a;">${safeStudentName}</td>
              </tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: bold; color: #475569;">Série / Turma:</td>
                <td style="padding: 10px 14px; color: #0f172a;">${safeGrade}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: bold; color: #475569;">Infração / Motivo:</td>
                <td style="padding: 10px 14px; color: #dc2626; font-weight: bold;">${safeOccurrenceType}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 10px 14px; font-weight: bold; color: #475569;">Professor(a):</td>
                <td style="padding: 10px 14px; color: #0f172a;">${safeTeacherName}</td>
              </tr>
            </table>

            <div style="background: #f1f5f9; padding: 18px; border-left: 4px solid #1e3a8a; border-radius: 6px; margin-bottom: 22px;">
              <strong style="color: #1e3a8a; display: block; margin-bottom: 8px; font-size: 14px;">Descrição Detalhada do Ocorrido:</strong>
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; font-size: 13.5px; color: #1e293b;">${safeDescription}</p>
            </div>

            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px;">
              <p style="margin: 0; font-size: 13px; color: #065f46; font-weight: 500;">
                📎 <strong>Documento PDF Anexo:</strong> O arquivo oficial pronto para impressão, assinatura e arquivo institucional está anexado a este e-mail.
              </p>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Sistema de Registro de Ocorrências Escolares • E.E. Coronel Ary Gomes
          </div>
        </div>
      `,
      attachments: pdfBuffer ? [
        {
          filename: attachmentFilename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ] : []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ E-mail enviado com sucesso para ${cleanCoordinationEmail}. ID: ${info.messageId}`);

    return res.status(200).json({
      success: true,
      message: `Ocorrência e documento PDF enviados com sucesso para a coordenação (${cleanCoordinationEmail})!`,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Erro no envio de e-mail na Vercel:', error);
    return res.status(500).json({
      success: false,
      message: `Falha ao enviar e-mail: ${error.message || 'Erro interno no servidor de envio'}`
    });
  }
}
