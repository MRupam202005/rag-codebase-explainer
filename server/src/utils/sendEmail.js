import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // If no SMTP host is configured, we will "mock" the email
    if (!process.env.SMTP_HOST && !process.env.SMTP_USER) {
        console.log("==========================================");
        console.log("📧 MOCK EMAIL SENT");
        console.log(`To: ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body:\n${options.message}`);
        console.log("==========================================");
        return;
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
        port: process.env.SMTP_PORT || 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS, // App Password
        },
    });

    // Define the email options
    const mailOptions = {
        from: `RAG Codebase Explainer <${process.env.SMTP_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

export default sendEmail;
