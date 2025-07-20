import emailjs from "@emailjs/browser";

export async function notifyUser(
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  try {
    const templateParams = {
      to_email: email,
      subject,
      message,
    };

    const response = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
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
