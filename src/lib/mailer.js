import nodemailer from "nodemailer";
import fs from "node:fs/promises";
import path from "node:path";

function hasSMTP() {
  return (
    process.env.MAIL_HOST &&
    process.env.MAIL_PORT &&
    process.env.MAIL_USER &&
    process.env.MAIL_PASS &&
    process.env.MAIL_FROM
  );
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
  : null;

async function renderTemplate(name, variables = {}) {
  const filePath = path.join(process.cwd(), "src", "lib", `${name}.html`);
  let html = await fs.readFile(filePath, "utf-8");

  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  return html;
}

export const mailer = {
  async sendMail({ to, subject, html, text }) {
    if (!transporter) {
      console.log(`[DEV] Mail to ${to} - ${subject}\n${text || html}`);
      return;
    }

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ""), // fallback text
      html,
    });
  },

  async sendVerification(email, token) {
    const front = process.env.FRONT_URL || "http://localhost:5173";
    const verifyUrl = `${front}/verify-email?token=${token}`;
    const html = await renderTemplate("verify-email", { VERIFY_URL: verifyUrl });

    await this.sendMail({
      to: email,
      subject: "Confirme ton email",
      html,
    });
  },

  async sendResetPassword(email, token) {
    const front = process.env.FRONT_URL || "http://localhost:5173";
    const resetUrl = `${front}/reset-password?token=${token}`;
    const html = await renderTemplate("reset-password", { RESET_URL: resetUrl,
    YEAR: new Date().getFullYear().toString()
    });

    await this.sendMail({
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html,
    });
  },
};
