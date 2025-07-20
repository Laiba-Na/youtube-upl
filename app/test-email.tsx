import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      action: "sendEmail",
      email: "maryamshabir025@gmail.com",
      subject: "Test Email",
      message: "This is a test email from your YouTube Uploader app.",
      postTitle: "Test Post",
      scheduledAt: "N/A",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Test email API error:", errorMessage);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
