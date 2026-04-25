import nodemailer, { type Transporter } from "nodemailer";
import pug from "pug";
import { convert } from "html-to-text";
import path from "path";

class Email {
  private to: string;
  private firstName: string;
  private url: string;
  private from: string;

  constructor(user: { email: string; name: string }, url: string) {
    this.to = user.email;
    this.firstName = user.name?.split(" ")[0] || "User";
    this.url = url;
    this.from = `Ahmed Monem <${process.env.EMAIL_FROM}>`;
  }

  private newTransport(): Transporter {
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  private async send(template: string, subject: string): Promise<void> {
    const templatePath = path.join(
      __dirname,
      "..",
      "views",
      "email",
      `${template}.pug`,
    );

    const html = pug.renderFile(templatePath, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    const transporter = this.newTransport();

    await transporter.sendMail({
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    });
  }

  async sendWelcome(): Promise<void> {
    await this.send(
      "welcome",
      "Welcome to the Men3em E-Commerce-Express Family!",
    );
  }

  async sendPasswordReset(): Promise<void> {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)",
    );
  }
}

export default Email;
