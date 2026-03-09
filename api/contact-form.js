const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ response: 'error', errorMessage: 'Method Not Allowed' });
    }

    // Porto standard success/error response structure
    try {
        const { name, email, subject, message: userMessage } = req.body;

        // 1. Configure Transporter
        // Recommendation: Use environment variables for SMTP settings in Vercel
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'mail.yourserver.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // 2. Build the message body (matching the Porto PHP logic)
        let htmlMessage = '';
        for (const [key, value] of Object.entries(req.body)) {
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            htmlMessage += `<strong>${label}:</strong> ${String(value).replace(/\n/g, '<br>')}<br>`;
        }

        // 3. Send Mail
        await transporter.sendMail({
            from: `"${name || 'Website User'}" <${process.env.SMTP_USER || 'info@ccx.eco'}>`,
            to: process.env.CONTACT_EMAIL || 'info@ccx.eco',
            replyTo: email,
            subject: subject || 'Contact Form Submission from IDTECHX',
            html: htmlMessage,
        });

        return res.status(200).json({ response: 'success' });
    } catch (error) {
        console.error('Contact Form Error:', error);
        return res.status(500).json({ response: 'error', errorMessage: error.message });
    }
}
