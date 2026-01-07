// test-email.ts
import * as nodemailer from 'nodemailer';

async function testEmail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'irfan.bvoir@gmail.com',
      pass: 'jluibghhwllwnnqy',
    },
  });

  await transporter.sendMail({
    from: '"Irfan" <irfan.bvoir@gmail.com>',
    to: 'irfan.bvoir@gmail.com', // or any test email
    subject: 'SMTP Test',
    text: 'Success! Your NestJS email setup works.',
  });

  console.log('✅ Email sent!');
}

testEmail().catch(console.error);