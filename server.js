import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {
  // Já carregado via dotenv
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS restrito a origens permitidas
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://ocorrencias-escolares.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pela política de CORS'));
    }
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  credentials: false
}));

// Limite de payload seguro contra DoS (8MB para Base64 PDF)
app.use(express.json({ limit: '8mb' }));

// Rate limiting em memória (20 requisições por minuto por IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

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

// Limpeza de cache a cada 5 minutos
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

// Sanitização contra XSS
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Sanitização contra CRLF Injection em cabeçalhos de e-mail
function sanitizeHeader(text, maxLen = 120) {
  if (typeof text !== 'string') return '';
  return text.replace(/[\r\n\t]/g, ' ').trim().slice(0, maxLen);
}

// Transporter Nodemailer (Gmail / SMTP / Ethereal)
let transporter;
let senderAddress = process.env.SMTP_USER || 'arygomescoord2026@gmail.com';
let isEthereal = false;

async function initTransporter() {
  const rawPass = process.env.SMTP_PASS || '';
  const cleanPass = rawPass.replace(/\s+/g, '');

  if (cleanPass) {
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

    senderAddress = user;
    console.log(`📡 Configurando envio de e-mail com a conta: ${senderAddress}`);

    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Erro de autenticação SMTP com o Gmail:', error.message);
      } else {
        console.log('✅ Conexão SMTP com o Gmail autenticada com sucesso! Pronto para disparar e-mails.');
      }
    });
  } else {
    try {
      console.warn('⚠️ SMTP_PASS não encontrada no .env. Inicializando conta de testes Ethereal...');
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
      senderAddress = testAccount.user;
      isEthereal = true;
      console.log('✅ Conta de teste Ethereal ativa.');
    } catch (err) {
      console.error('Erro ao inicializar conta de teste:', err.message);
    }
  }
}

initTransporter();

// Endpoint de Status / Health Check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    sender: senderAddress,
    isEthereal,
    hasPassword: Boolean(process.env.SMTP_PASS)
  });
});

// Endpoint de Envio de E-mail de Ocorrência Escolar
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
      teacherEmail = '',
      pdfBase64
    } = req.body || {};

    if (!teacherName || !studentName || !grade || !description) {
      return res.status(400).json({ success: false, message: 'Dados da ocorrência incompletos.' });
    }

    // Validação de e-mail e formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanCoordinationEmail = sanitizeHeader(coordinationEmail, 100);
    if (!emailRegex.test(cleanCoordinationEmail)) {
      return res.status(400).json({ success: false, message: 'Endereço de e-mail da coordenação inválido.' });
    }

    const cleanTeacherEmail = teacherEmail ? sanitizeHeader(teacherEmail, 100) : '';
    if (cleanTeacherEmail && !emailRegex.test(cleanTeacherEmail)) {
      return res.status(400).json({ success: false, message: 'Endereço de e-mail do professor inválido.' });
    }

    // Sanitização e validação de tamanho de campos
    const safeTeacherName = escapeHtml(sanitizeHeader(teacherName, 120));
    const safeStudentName = escapeHtml(sanitizeHeader(studentName, 120));
    const safeGrade = escapeHtml(sanitizeHeader(grade, 50));
    const safeOccurrenceType = escapeHtml(sanitizeHeader(occurrenceType, 120));
    const safeDateTime = escapeHtml(sanitizeHeader(dateTime, 60));
    const safeDescription = escapeHtml(typeof description === 'string' ? description.slice(0, 15000) : '');

    const base64Data = pdfBase64 
      ? (pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64) 
      : null;
    const pdfBuffer = base64Data ? Buffer.from(base64Data, 'base64') : null;

    const sanitizedStudentFile = studentName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
    const attachmentFilename = `Ocorrencia_${sanitizedStudentFile}_${new Date().toISOString().slice(0, 10)}.pdf`;

    const mailOptions = {
      from: `"E.E. Coronel Ary Gomes - Ocorrências" <${senderAddress}>`,
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

    if (!transporter) {
      return res.status(500).json({ success: false, message: 'Serviço de e-mail não inicializado.' });
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ E-mail enviado para ${cleanCoordinationEmail}. ID: ${info.messageId}`);
    
    let previewUrl = null;
    if (isEthereal) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Link de pré-visualização Ethereal: ${previewUrl}`);
      }
    }

    return res.json({
      success: true,
      message: `Ocorrência e documento PDF enviados com sucesso para a coordenação (${cleanCoordinationEmail})!`,
      messageId: info.messageId,
      previewUrl
    });

  } catch (err) {
    console.error('❌ Erro no envio do e-mail:', err);
    res.status(500).json({ 
      success: false, 
      message: `Erro ao enviar e-mail: ${err.message || 'Falha no servidor SMTP'}` 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de e-mails de ocorrência rodando na porta ${PORT}`);
});
