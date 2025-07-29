import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    const serviceId = process.env.EMAILJS_FORGOT_PASSWORD_SERVICE_ID;
    const templateId = process.env.EMAILJS_FORGOT_PASSWORD_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_FORGOT_PASSWORD_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_FORGOT_PASSWORD_PRIVATE_KEY;
    
    if (!serviceId || !templateId || !publicKey || !privateKey) {
      return NextResponse.json({ error: "EmailJS configuration missing" }, { status: 500 });
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
          to_email: email,
          new_password: password,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`EmailJS error: ${error}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}