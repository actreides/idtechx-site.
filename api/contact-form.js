const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ response: 'error', errorMessage: 'Method Not Allowed' });
    }

    // 1. Check if SMTP is configured
    const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.error('SMTP Configuration Missing');
        return res.status(200).json({
            response: 'error',
            errorMessage: 'Service is not fully configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in Vercel Environment Variables.'
        });
    }

    try {
        const { name, email, subject, message: userMessage } = req.body;

        // 2. Configure Transporter
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });

        // 3. Build the message body
        let htmlFields = '';
        for (const [key, value] of Object.entries(req.body)) {
            if (['name', 'email', 'subject', 'message'].includes(key.toLowerCase())) continue;
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            htmlFields += `<strong>${label}:</strong> ${String(value).replace(/\n/g, '<br>')}<br>`;
        }

        const htmlBody = `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${String(userMessage || '').replace(/\n/g, '<br>')}</p>
            <hr>
            ${htmlFields}
        `;

        // 4. Send Mail
        await transporter.sendMail({
            from: `"${name || 'Website User'}" <${SMTP_USER}>`,
            to: process.env.CONTACT_EMAIL || SMTP_USER,
            replyTo: email,
            subject: subject || 'Contact Form Submission from IDTECHX',
            html: htmlBody,
        });

        return res.status(200).json({ response: 'success' });
    } catch (error) {
        console.error('Contact Form Error:', error);
        return res.status(500).json({ response: 'error', errorMessage: 'Internal Server Error' });
    }
}
