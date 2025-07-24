import emailjs from "@emailjs/browser";

export const notifyUser = async (
  email: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    const serviceId = "service_bszi0y6";
    const templateId = "template_srvrqae";
    const publicKey = "u0ZFvzFD-Un6RF9xI";

    const templateParams = {
      to_email: email,
      subject: subject,
      message: message,
    };

    console.log("Sending email to:", email, "with params:", templateParams);

    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );
    console.log("EmailJS response:", {
      status: response.status,
      text: response.text,
    });
    return response.status === 200;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to send email to", email, ":", errorMessage, error);
    return false;
  }
};
