const mailchimp = require('@mailchimp/mailchimp_marketing');

export default async function handler(req, res) {
    // Support both POST and GET to replicate legacy behavior
    const email = req.method === 'POST' ? req.body.email : req.query.email;

    if (!email) {
        return res.status(400).json({ response: 'error', message: 'Email is required' });
    }

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const listId = process.env.MAILCHIMP_LIST_ID;
    const serverPrefix = apiKey ? apiKey.split('-')[1] : 'us1';

    if (!apiKey || !listId) {
        return res.status(500).json({
            response: 'error',
            message: 'Mailchimp is not configured (missing API Key or List ID in environment variables)'
        });
    }

    mailchimp.setConfig({
        apiKey: apiKey,
        server: serverPrefix,
    });

    try {
        await mailchimp.lists.addListMember(listId, {
            email_address: email,
            status: 'subscribed',
        });

        return res.status(200).json({ response: 'success' });
    } catch (error) {
        console.error('Mailchimp Error:', error);

        // Check if the user is already subscribed (Mailchimp returns 400 for this)
        if (error.status === 400 && error.response.body.title === 'Member Exists') {
            return res.status(200).json({ response: 'success' }); // Treat as success or handle as "already subscribed"
        }

        return res.status(500).json({
            response: 'error',
            message: error.response?.body?.detail || error.message
        });
    }
}
