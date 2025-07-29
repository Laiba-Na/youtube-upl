import { NextRequest, NextResponse } from 'next/server';
import emailjs from '@emailjs/nodejs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();
    
    // Validate inputs
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }
    
    emailjs.init({
      publicKey: process.env.EMAILJS_FORGOT_PASSWORD_PUBLIC_KEY || '',
      privateKey: process.env.EMAILJS_FORGOT_PASSWORD_PRIVATE_KEY || '',
    });

    // Send the email
    const response = await emailjs.send(
      process.env.EMAILJS_FORGOT_PASSWORD_SERVICE_ID || '',
      process.env.NEXT_PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID || '',
      {
        to_email: 'zoyamonal1502@gmail.com',
        from_name: name,
        from_email: email,
        subject: subject,
        message: message,
      }
    );

    if (response.status === 200) {
      return NextResponse.json(
        { success: true, message: 'Email sent successfully' },
        { status: 200 }
      );
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}