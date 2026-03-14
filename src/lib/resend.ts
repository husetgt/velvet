import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, displayName: string) {
  try {
    await resend.emails.send({
      from: 'Velvet <noreply@velvetfan.com>',
      to: email,
      subject: 'Welcome to Velvet',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Velvet</title>
          </head>
          <body style="background-color: #0d0d0f; color: #ffffff; font-family: Inter, sans-serif; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="font-size: 36px; font-weight: 700; background: linear-gradient(135deg, #e040fb, #7c4dff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">Velvet</h1>
              </div>
              <div style="background: linear-gradient(135deg, rgba(224,64,251,0.1), rgba(124,77,255,0.1)); border: 1px solid rgba(224,64,251,0.2); border-radius: 16px; padding: 40px;">
                <h2 style="font-size: 24px; font-weight: 600; margin: 0 0 16px;">Welcome, ${displayName}!</h2>
                <p style="color: #a0a0b0; line-height: 1.6; margin: 0 0 24px;">
                  You're now part of Velvet — the premium platform connecting fans with their favorite creators.
                </p>
                <p style="color: #a0a0b0; line-height: 1.6; margin: 0 0 32px;">
                  Discover exclusive content, subscribe to your favorite creators, and enjoy a truly premium experience.
                </p>
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #e040fb, #7c4dff); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Explore Velvet
                  </a>
                </div>
              </div>
              <p style="text-align: center; color: #555570; font-size: 12px; margin-top: 32px;">
                &copy; 2024 Velvet. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}
