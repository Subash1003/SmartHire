import nodemailer from 'nodemailer';
import { isEmailConfigured, emailConfig } from '../config/email.js';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465,
      auth: { user: emailConfig.user, pass: emailConfig.password },
    });
  }
  return transporter;
}

// Sends the email if SMTP is configured, otherwise logs it to the console.
// Mirrors the isCloudinaryConfigured/isAiConfigured pattern: a missing
// third-party credential degrades a feature, it never crashes the API.
async function deliver({ to, subject, text }) {
  if (!isEmailConfigured) {
    console.log(`[dev email] To: ${to}\nSubject: ${subject}\n\n${text}`);
    return;
  }

  try {
    await getTransporter().sendMail({
      from: `SmartHire <${emailConfig.user}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
  }
}

export async function sendVerificationEmail(user, rawToken) {
  await deliver({
    to: user.email,
    subject: 'Verify your SmartHire email address',
    text: `Hi ${user.name},\n\nPlease verify your email address by visiting the link below:\n${env.clientUrl}/verify-email?token=${rawToken}\n\nIf you didn't create a SmartHire account, you can ignore this email.`,
  });
}

export async function sendPasswordResetEmail(user, rawToken) {
  await deliver({
    to: user.email,
    subject: 'Reset your SmartHire password',
    text: `Hi ${user.name},\n\nWe received a request to reset your password. Visit the link below to choose a new one:\n${env.clientUrl}/reset-password?token=${rawToken}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
  });
}

export async function sendApplicationConfirmationEmail(candidate, job) {
  await deliver({
    to: candidate.email,
    subject: `Your application for ${job.title} was received`,
    text: `Hi ${candidate.name},\n\nWe've received your application for "${job.title}". You can track its status from your SmartHire dashboard.\n\nGood luck!`,
  });
}

export async function sendApplicationStatusEmail(candidate, job, status) {
  await deliver({
    to: candidate.email,
    subject: `Update on your application for ${job.title}`,
    text: `Hi ${candidate.name},\n\nThe status of your application for "${job.title}" has been updated to: ${status}.\n\nYou can view the details on your SmartHire dashboard.`,
  });
}

export async function sendApplicationDecisionEmail(candidate, job, status) {
  await deliver({
    to: candidate.email,
    subject: `A decision has been made on your application for ${job.title}`,
    text: `Hi ${candidate.name},\n\nA final decision has been recorded for your application to "${job.title}": ${status}.\n\nYou can view the details on your SmartHire dashboard.`,
  });
}

function formatInterviewTime(interview) {
  return new Date(interview.startTime).toUTCString();
}

export async function sendInterviewScheduledEmail(recipient, interview, job) {
  await deliver({
    to: recipient.email,
    subject: `Interview scheduled: ${job.title}`,
    text: `Hi ${recipient.name},\n\nAn interview has been scheduled for "${job.title}".\n\nType: ${interview.type}\nRound: ${interview.round}\nTime: ${formatInterviewTime(interview)} (UTC)\n${interview.meetingLink ? `Meeting link: ${interview.meetingLink}\n` : ''}\nPlease check your SmartHire dashboard for details.`,
  });
}

export async function sendInterviewRescheduledEmail(recipient, interview, job) {
  await deliver({
    to: recipient.email,
    subject: `Interview rescheduled: ${job.title}`,
    text: `Hi ${recipient.name},\n\nThe interview for "${job.title}" has been rescheduled.\n\nNew time: ${formatInterviewTime(interview)} (UTC)\n${interview.meetingLink ? `Meeting link: ${interview.meetingLink}\n` : ''}\nPlease check your SmartHire dashboard for details.`,
  });
}

export async function sendInterviewCancelledEmail(recipient, interview, job) {
  await deliver({
    to: recipient.email,
    subject: `Interview cancelled: ${job.title}`,
    text: `Hi ${recipient.name},\n\nThe interview scheduled for "${job.title}" on ${formatInterviewTime(interview)} (UTC) has been cancelled.\n\nPlease check your SmartHire dashboard for details.`,
  });
}
