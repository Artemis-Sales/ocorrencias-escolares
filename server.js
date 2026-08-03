import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Tarefa 3: CORS restrito a domínios permitidos ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://ocorrencias-escolares.vercel.app'
];
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (ex: Postman, curl em dev) ou origens permitidas
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pela política de CORS'));
    }
  },
  methods: ['POST'],
  credentials: false
}));

app.use(express.json({ limit: '25mb' }));

// --- Tarefa 4: Rate limiting básico em memória ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 10;   // 10 requisições por minuto por IP

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Limite de envios atingido. Aguarde um minuto antes de tentar novamente.'
    });
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  next();
}

// Limpa entries antigas a cada 5 minutos para evitar memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const active = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (active.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, active);
    }
  }
}, 5 * 60_000);

// --- Tarefa 2: Função de sanitização HTML para prevenir XSS ---
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Transporter Nodemailer (Utiliza Ethereal ou SMTP para envio real)
let transporter;
let senderAddress = '';

async function initTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    // --- Tarefa 5: Usar o endereço real do remetente SMTP configurado ---
    senderAddress = process.env.SMTP_USER;
    console.log('✅ Servidor de e-mail SMTP personalizado configurado.');
  } else {
    // Cria conta de teste no Ethereal/Nodemailer para captura de e-mails em tempo real
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      // --- Tarefa 5: Usar o endereço Ethereal como remetente ---
      senderAddress = testAccount.user;
      console.log('✅ Conta de teste Ethereal criada com sucesso!');
    } catch (err) {
      console.error('Aviso ao inicializar conta de teste:', err.message);
    }
  }
}

initTransporter();

// Endpoint de Envio de E-mail de Ocorrência Escolar (com rate limit)
app.post('/api/send-email', rateLimit, async (req, res) => {
  try {
    const {
      teacherName,
      studentName,
      grade,
      occurrenceType,
      dateTime,
      description,
      coordinationEmail = 'arygomescoord2026@gmail.com',
      pdfBase64
    } = req.body;

    if (!teacherName || !studentName || !grade || !description) {
      return res.status(400).json({ success: false, message: 'Dados da ocorrência incompletos.' });
    }

    // Validação básica de e-mail no servidor
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(coordinationEmail)) {
      return res.status(400).json({ success: false, message: 'Endereço de e-mail inválido.' });
    }

    // --- Tarefa 2: Sanitizar todos os inputs antes de interpolar no HTML ---
    const safeTeacherName = escapeHtml(teacherName);
    const safeStudentName = escapeHtml(studentName);
    const safeGrade = escapeHtml(grade);
    const safeOccurrenceType = escapeHtml(occurrenceType);
    const safeDateTime = escapeHtml(dateTime);
    const safeDescription = escapeHtml(description);
    const safeCoordinationEmail = escapeHtml(coordinationEmail);

    // Processa a string Base64 do PDF para Buffer de anexo
    const base64Data = pdfBase64 ? pdfBase64.replace(/^data:application\/pdf;base64,/, '') : null;
    const pdfBuffer = base64Data ? Buffer.from(base64Data, 'base64') : null;

    const sanitizedStudent = studentName.replace(/[^a-z0-9]/gi, '_');
    const attachmentFilename = `Ocorrencia_${sanitizedStudent}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Monta o e-mail em HTML elegante (com inputs sanitizados)
    const mailOptions = {
      from: `"E.E. Coronel Ary Gomes - Ocorrências" <${senderAddress}>`,
      to: coordinationEmail,
      subject: `🚨 [Ocorrência Escolar PEI] ${safeGrade} - ${safeStudentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #1e3a8a; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">E.E. CORONEL ARY GOMES - PEI</h2>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Governo do Estado de São Paulo</p>
          </div>
          
          <div style="padding: 24px; background: #ffffff; color: #0f172a;">
            <h3 style="color: #1e3a8a; margin-top: 0;">Novo Registro de Ocorrência Escolar</h3>
            <p>Prezada Coordenação Pedagógica,</p>
            <p>Um novo registro de ocorrência disciplinar foi gerado pelo professor(a) responsável. Seguem os detalhes:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold; width: 35%;">Data / Hora:</td>
                <td style="padding: 10px;">${safeDateTime}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold;">Aluno(a):</td>
                <td style="padding: 10px;">${safeStudentName}</td>
              </tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold;">Série / Turma:</td>
                <td style="padding: 10px;">${safeGrade}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold;">Infração:</td>
                <td style="padding: 10px; color: #dc2626; font-weight: bold;">${safeOccurrenceType}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 10px; font-weight: bold;">Professor(a):</td>
                <td style="padding: 10px;">${safeTeacherName}</td>
              </tr>
            </table>

            <div style="background: #f1f5f9; padding: 16px; border-left: 4px solid #1e3a8a; border-radius: 4px; margin-bottom: 20px;">
              <strong style="color: #1e3a8a; display: block; margin-bottom: 8px;">Descrição da Ocorrência:</strong>
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.5;">${safeDescription}</p>
            </div>

            <p style="font-size: 13px; color: #64748b;">
              📎 O documento PDF oficial gerado para arquivamento e colheita de ciente foi anexado a este e-mail.
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 12px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            Sistema de Registro de Ocorrências Escolares - E.E. Coronel Ary Gomes
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

    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✉️ E-mail enviado para ${coordinationEmail}. ID: ${info.messageId}`);
      
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Link de pré-visualização Ethereal: ${previewUrl}`);
      }

      return res.json({
        success: true,
        message: `Ocorrência e PDF anexado enviados com sucesso para o e-mail da coordenação (${safeCoordinationEmail})!`,
        previewUrl
      });
    }

    return res.json({
      success: true,
      message: `Ocorrência processada com sucesso para ${safeCoordinationEmail}.`
    });

  } catch (err) {
    console.error('Erro no envio do e-mail:', err);
    res.status(500).json({ success: false, message: 'Falha interna ao disparar o e-mail da ocorrência.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de e-mails de ocorrência rodando na porta ${PORT}`);
});
