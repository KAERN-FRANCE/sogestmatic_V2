import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const conversationId = formData.get('conversationId') as string
    const conversationTitle = formData.get('conversationTitle') as string
    const email = formData.get('email') as string
    const pdfFile = formData.get('pdf') as File

    if (!email || !pdfFile) {
      return NextResponse.json({ error: 'Email et PDF requis' }, { status: 400 })
    }

    // Configuration du transporteur email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Convertir le fichier PDF en buffer
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer())

    // Configuration de l'email
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@sogestmatic.com',
      to: email,
      subject: `Conversation Sogestmatic - ${conversationTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d5a27;">Conversation Sogestmatic</h2>
          <p>Bonjour,</p>
          <p>Vous trouverez ci-joint la conversation "<strong>${conversationTitle}</strong>" exportée depuis notre assistant IA spécialisé en réglementation transport.</p>
          <p>Cette conversation contient des informations précieuses sur la réglementation transport routier.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Cet email a été envoyé depuis l'application Sogestmatic.<br>
            Pour toute question, contactez-nous à info@sogestmatic.com
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${conversationTitle}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    }

    // Envoyer l'email
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ 
      success: true, 
      message: 'Conversation envoyée avec succès' 
    })

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email' }, 
      { status: 500 }
    )
  }
}
