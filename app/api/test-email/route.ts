import { NextResponse } from "next/server";

export async function GET() {
  // This API route signals the client to send the email
  return NextResponse.json({
    action: "sendEmail",
    email: "maryamshabir025@gmail.com",
    subject: "Test Email",
    message: "This is a test email from your YouTube Uploader app.",
  });
}
