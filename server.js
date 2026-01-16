import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();

/* =========================================================
   ✅ MIDDLEWARE
========================================================= */
app.use(express.json());

// ✅ Allowed origins list
const allowedOrigins = [
  "https://youngachievers-2.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
];

// ✅ CORS config (Render + local)
const corsOptions = {
  origin: function (origin, callback) {
    // Postman / server-to-server (no origin) allow
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS blocked: Origin not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// ✅ Apply cors middleware
app.use(cors(corsOptions));

// ✅ Preflight request handle (IMPORTANT)
app.options(/.*/, cors(corsOptions));

/* =========================================================
   ✅ ENV VALIDATION (IMPORTANT)
========================================================= */
const { EMAIL_USER, EMAIL_PASS, ADMIN_EMAIL } = process.env;

if (!EMAIL_USER || !EMAIL_PASS || !ADMIN_EMAIL) {
  console.error("❌ ENV Missing! Please add these in Render:");
  console.error("EMAIL_USER, EMAIL_PASS, ADMIN_EMAIL");
} 

/* =========================================================
   ✅ HEALTH CHECK
========================================================= */
app.get("/", (req, res) => {
  res.status(200).send("✅ Backend running...");
});

/* =========================================================
   ✅ NODEMAILER TRANSPORTER
========================================================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// ✅ Verify transporter (Render logs me show hoga)
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Nodemailer transporter error:", err);
  } else {
    console.log("✅ Nodemailer transporter ready!");
  }
});

/* =========================================================
   ✅ 1) CONTACT INQUIRY API
========================================================= */
app.post("/api/contact-inquiry", async (req, res) => {
  try {
    const { childName, phone, admissionClass, message } = req.body;

    // ✅ validation
    if (!childName || !phone || !message) {
      return res.status(400).json({
        message: "childName, phone and message required!",
      });
    }

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; padding:20px; max-width:700px; margin:auto; border-radius:14px; border:1px solid #e5e7eb;">
        
        <div style="background:linear-gradient(90deg,#673AB7,#4FC3F7,#FFB74D); padding:18px; border-radius:14px; color:#fff;">
          <h2 style="margin:0;">📩 New Contact Inquiry</h2>
          <p style="margin:6px 0 0; opacity:.95;">Young Achievers School Website</p>
        </div>

        <div style="padding:18px 10px;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:10px; border:1px solid #e5e7eb; font-weight:700; background:#f9fafb;">Child Name</td>
              <td style="padding:10px; border:1px solid #e5e7eb;">${childName}</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #e5e7eb; font-weight:700; background:#f9fafb;">Phone</td>
              <td style="padding:10px; border:1px solid #e5e7eb;">${phone}</td>
            </tr>
            <tr>
              <td style="padding:10px; border:1px solid #e5e7eb; font-weight:700; background:#f9fafb;">Admission Class</td>
              <td style="padding:10px; border:1px solid #e5e7eb;">${admissionClass || "-"}</td>
            </tr>
          </table>

          <h3 style="margin-top:18px;">Message</h3>
          <div style="padding:14px; border-radius:12px; background:#f9fafb; border:1px solid #e5e7eb; line-height:1.6;">
            ${message}
          </div>

          <div style="margin-top:20px; text-align:center;">
            <a href="tel:${phone}" style="display:inline-block;background:#FF5E5E;color:white;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700;">
              📞 Call Parent
            </a>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Young Achievers Website" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `📩 New Contact Inquiry: ${childName}`,
      html: htmlTemplate,
    });

    return res.status(200).json({
      message: "✅ Contact inquiry email sent successfully!",
    });
  } catch (err) {
    console.error("❌ Contact Inquiry error:", err);
    return res.status(500).json({
      message: "❌ Failed to send contact inquiry email",
      error: err.message,
    });
  }
});

/* =========================================================
   ✅ 2) ADMISSION INQUIRY API
========================================================= */
app.post("/api/admission-inquiry", async (req, res) => {
  try {
    const { studentName, admissionClass, dob, phone, lastSchool, address } =
      req.body;

    // ✅ validation
    if (!studentName || !admissionClass || !dob || !phone) {
      return res.status(400).json({
        message: "studentName, admissionClass, dob, phone required!",
      });
    }

    const admissionTemplate = `
      <div style="font-family: Arial, sans-serif; padding:20px; max-width:700px; margin:auto; border-radius:14px; border:1px solid #e5e7eb;">
        
        <div style="background:linear-gradient(90deg,#00BCD4,#673AB7,#FFB74D); padding:18px; border-radius:14px; color:#fff;">
          <h2 style="margin:0;">🎓 New Admission Inquiry</h2>
          <p style="margin:6px 0 0; opacity:.95;">Young Achievers School Website</p>
        </div>

        <div style="padding:18px 10px;">
          <h3 style="margin:0 0 10px; color:#111827;">Student Details</h3>

          <table style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr>
              <td style="padding:10px; border:1px solid #e5e7eb; font-weight:700; background:#f9fafb;">Student Name</td>
              <td style="padding:10px; border:1px solid #e5e7eb;">${studentName}</td>
            </tr>

            <tr>
              <td style="padding:10px; border:1px solid #e5e7eb; font-weight:700; background:#f9fafb;">Admission Class</td>
              <td style="padding:10px; border:1px solid #e5e7eb;">${admissionClass}</td>
            </tr>

            <tr>
              <td style="padding:10px; border:1px solid #e5e7eb; font-weight:700; background:#f9fafb;">DOB</td>
              <td style="padding:10px; border:1px solid #e5e7eb;">${dob}</td>
            </tr>

            <tr>
              <td style="padding:10px; border:1px solid #e5e7eb; font-weight:700; background:#f9fafb;">Phone</td>
              <td style="padding:10px; border:1px solid #e5e7eb;">${phone}</td>
            </tr>

            <tr>
              <td style="padding:10px; border:1px solid #e5e7eb; font-weight:700; background:#f9fafb;">Last School</td>
              <td style="padding:10px; border:1px solid #e5e7eb;">${lastSchool || "-"}</td>
            </tr>

            <tr>
              <td style="padding:10px; border:1px solid #e5e7eb; font-weight:700; background:#f9fafb;">Address</td>
              <td style="padding:10px; border:1px solid #e5e7eb;">${address || "-"}</td>
            </tr>
          </table>

          <div style="margin-top:20px; text-align:center;">
            <a href="tel:${phone}" style="display:inline-block;background:#00BCD4;color:white;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700;">
              📞 Call Parent
            </a>
          </div>

          <p style="margin-top:18px;font-size:12px;color:#6b7280;text-align:center;">
            This admission inquiry was submitted from the official school website.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Young Achievers Website" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `🎓 New Admission Inquiry: ${studentName} (${admissionClass})`,
      html: admissionTemplate,
    });

    return res.status(200).json({
      message: "✅ Admission inquiry email sent successfully!",
    });
  } catch (err) {
    console.error("❌ Admission Inquiry error:", err);
    return res.status(500).json({
      message: "❌ Failed to send admission inquiry email",
      error: err.message,
    });
  }
});

/* =========================================================
   ✅ SERVER START
========================================================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
