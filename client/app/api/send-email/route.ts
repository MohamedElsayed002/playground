import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => {});
  console.log("from send email", body);
  const to = body.to as string[] | undefined;
  const subject = body.subject as string | undefined;
  const text = body.text as string | undefined;
  const html = body.html as string | undefined;

  if (!subject || (!text && !html)) {
    return NextResponse.json(
      { success: false, sentCount: 0, message: "subject and text/html are required" },
      { status: 400 },
    );
  }

  if (!to || to.length === 0) {
    return NextResponse.json(
      { success: false, sentCount: 0, message: "At least one recipient is required" },
      { status: 400 },
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });

  return NextResponse.json({
    success: true,
    sendCount: to.length,
    message: "Email sent successfully",
  });
}
