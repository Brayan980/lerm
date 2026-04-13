import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  // service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    // user: process.env.GMAIL_USER, // tu cuenta Gmail
    // pass: process.env.GMAIL_PASS, // tu contraseña o App Password
    // user: "stevengf0424@gmail.com",
    // pass: "apho tjqr meil ieok"
  },
});
