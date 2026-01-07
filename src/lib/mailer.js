import nodemailer from "nodemailer"
import fs from "node:fs/promises"
import path from "node:path"

function hasSMTP() {
  return (
    process.env.MAIL_HOST &&
    process.env.MAIL_PORT &&
    process.env.MAIL_USER &&
    process.env.MAIL_PASS &&
    process.env.MAIL_FROM
  )
}

const transporter = hasSMTP()
  ? nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: Number(process.env.MAIL_PORT) === 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })
  : null

async function renderTemplate(name, variables = {}) {
  const filePath = path.join(
    process.cwd(),
    "src",
    "templates",
    `${name}.html`
  )

  let html = await fs.readFile(filePath, "utf-8")

  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, value)
  }

  return html
}

export const mailer = {
  async sendVerification(email, token) {
    const front = process.env.FRONT_URL || "http://localhost:5173"
    const verifyUrl = `${front}/verify-email?token=${token}`

    if (!transporter) {
      console.log(`[DEV] Verification link for ${email}: ${verifyUrl}`);
      return
    }

    const html = await renderTemplate("verify-email", {
      VERIFY_URL: verifyUrl,
    });

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Confirme ton email",
      html,
    })
  },
}
