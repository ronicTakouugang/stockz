import nodemailer from 'nodemailer';
import {WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE} from "@/lib/nodemailer/template";

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

export interface WelcomeEmailData {
  email: string;
  name: string;
  intro: string;
}

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData): Promise<void> => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE
      .replace('{{name}}', name)
      .replace('{{intro}}', intro);

  const mailOptions = {
    from: `"Stockz" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: 'Welcome to Stockz - your stock market toolkit is ready!',
    text: "Thanks for joining Stockz!",
    html: htmlTemplate
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
      .replace('{{date}}', date)
      .replace('{{newsContent}}', newsContent);

  const mailOptions = {
    from: `"Stockz News" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `📈 Market News Summary Today - ${date}`,
    text: `Today's market news summary from Stockz`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};