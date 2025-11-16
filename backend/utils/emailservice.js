// const nodemailer = require("nodemailer");

// const sendWelcomeEmail = async (email, name) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",

//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from: `"CivicCare" <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Welcome to CivicCare!",
//     html: `
//       <h2>Hi ${name},</h2>
//       <p>🎉 Welcome to <b>CivicCare</b>! Your account has been successfully created.</p>
//       <p>You can now submit and track complaints, chat with authorities, and take part in improving the community.</p>
//       <br>
//       <p>Best regards,<br>CivicCare Team</p>
//     `
//   });
// };

// module.exports = sendWelcomeEmail;
const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: "ofoukzmbcmdmhgdl",
  },
});

// Wrap in an async IIFE so we can use await.
(async () => {
  const info = await transporter.sendMail({
    from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
    to: "bar@example.com, baz@example.com",
    subject: "Hello ✔",
    text: "Hello world?", // plain‑text body
    html: "<b>Hello world?</b>", // HTML body
  });

  console.log("Message sent:", info.messageId);
})();