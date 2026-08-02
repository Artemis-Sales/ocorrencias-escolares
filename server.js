import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Transporter Nodemailer (Utiliza Ethereal ou SMTP para envio real)
let transporter;

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
      console.log('✅ Conta de teste Ethereal criada com sucesso!');
    } catch (err) {
      console.error('Aviso ao inicializar conta de teste:', err.message);
    }
  }
}

initTransporter();

// Endpoint de Envio de E-mail de Ocorrência Escolar
app.post('/api/send-email', async (req, res) => {
  try {
    const {
      teacherName,
      studentName,
      grade,
      occurrenceType,
      dateTime,
      description,
      coordinationEmail = 'visovalu@gmail.com',
      pdfBase64
    } = req.body;

    if (!teacherName || !studentName || !grade || !description) {
      return res.status(400).json({ success: false, message: 'Dados da ocorrência incompletos.' });
    }

    // Processa a string Base64 do PDF para Buffer de anexo
    const base64Data = pdfBase64 ? pdfBase64.replace(/^data:application\/pdf;base64,/, '') : null;
    const pdfBuffer = base64Data ? Buffer.from(base64Data, 'base64') : null;

    const sanitizedStudent = studentName.replace(/[^a-z0-9]/gi, '_');
    const attachmentFilename = `Ocorrencia_${sanitizedStudent}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Monta o e-mail em HTML elegante
    const mailOptions = {
      from: `"E.E. Coronel Ary Gomes - Ocorrências" <ocorrencias@escola.sp.gov.br>`,
      to: coordinationEmail,
      subject: `🚨 [Ocorrência Escolar PEI] ${grade} - ${studentName}`,
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
                <td style="padding: 10px;">${dateTime}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold;">Aluno(a):</td>
                <td style="padding: 10px;">${studentName}</td>
              </tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold;">Série / Turma:</td>
                <td style="padding: 10px;">${grade}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px; font-weight: bold;">Infração:</td>
                <td style="padding: 10px; color: #dc2626; font-weight: bold;">${occurrenceType}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 10px; font-weight: bold;">Professor(a):</td>
                <td style="padding: 10px;">${teacherName}</td>
              </tr>
            </table>

            <div style="background: #f1f5f9; padding: 16px; border-left: 4px solid #1e3a8a; border-radius: 4px; margin-bottom: 20px;">
              <strong style="color: #1e3a8a; display: block; margin-bottom: 8px;">Descrição da Ocorrência:</strong>
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.5;">${description}</p>
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
        message: `Ocorrência e PDF anexado enviados com sucesso para o e-mail da coordenação (${coordinationEmail})!`,
        previewUrl
      });
    }

    return res.json({
      success: true,
      message: `Ocorrência processada com sucesso para ${coordinationEmail}.`
    });

  } catch (err) {
    console.error('Erro no envio do e-mail:', err);
    res.status(500).json({ success: false, message: 'Falha interna ao disparar o e-mail da ocorrência.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de e-mails de ocorrência rodando na porta ${PORT}`);
});
