import "server-only";

import { Resend } from "resend";

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailResult {
  id: string;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const fromEmail = process.env.EMAIL_FROM || "Arbiter <onboarding@resend.dev>";

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    text,
    html: html || text,
  });

  if (error) {
    throw new Error(`Email sending failed: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("Email provider did not return an email ID.");
  }

  return {
    id: data.id,
  };
}
