"use client";

import emailjs from "@emailjs/browser";

export async function sendEmail(
  email: string,
  subject: string,
  message: string,
  postTitle?: string,
  scheduledAt?: string
): Promise<boolean> {
  try {
    if (
      !process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ||
      !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ||
      !process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    ) {
      throw new Error(
        "Missing EmailJS configuration: Service ID, Template ID, or Public Key"
      );
    }

    const templateParams = {
      to_email: email,
      subject,
      message,
      postTitle: postTitle || "N/A",
      scheduledAt: scheduledAt || "N/A",
    };

    const response = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    );

    console.log("Email sent successfully:", response.status, response.text);
    return true;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown email error";
    console.error("Error sending email:", errorMessage);
    return false;
  }
}
