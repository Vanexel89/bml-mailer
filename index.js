const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*", methods: ["POST", "OPTIONS"], allowedHeaders: ["Content-Type", "X-API-Key"] }));
app.use(express.json({ limit: "1mb" }));

function checkAuth(req, res, next) {
  if (req.headers["x-api-key"] !== process.env.API_KEY) return res.status(401).json({ error: "Unauthorized" });
  next();
}

const transporter = nodemailer.createTransport({
  host: "smtp.yandex.ru",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

app.get("/", (req, res) => res.json({ status: "ok", service: "bml-mailer" }));

app.post("/send", checkAuth, async (req, res) => {
  try {
    const { to, subject, body, html } = req.body;
    if (!to || !subject || (!body && !html)) return res.status(400).json({ error: "Missing fields" });
    const toList = Array.isArray(to) ? to : [to];
    const info = await transporter.sendMail({
      from: `${process.env.SENDER_NAME || "BM Logistics"} <${process.env.SMTP_USER}>`,
      to: toList.join(", "),
      subject,
      text: body || "",
      html: html || undefined
    });
    res.json({ ok: true, messageId: info.messageId, to: toList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`BML Mailer on port ${PORT}`));
