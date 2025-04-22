const axios = require('axios');
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const token = process.env.TOKEN;
let chatIds = new Set();
const bot = new TelegramBot(token, { polling: true });


if (fs.existsSync('chatIds.json')) {
  const savedIds = JSON.parse(fs.readFileSync('chatIds.json', 'utf-8'));
  chatIds = new Set(savedIds);
}

bot.onText(/\/start/, (msg) => {
  chatIds.add(msg.chat.id);
  fs.writeFileSync('chatIds.json', JSON.stringify([...chatIds]));
  bot.sendMessage(msg.chat.id, "✅ You're now subscribed to Hyper Tracker alerts!");
});

async function getMarkets() {
    try {
        const response = await axios.post('https://api.hyperliquid.xyz/info', {
            type: 'meta'
        });


        const currentAssets = response.data.universe.map(item => ({
            asset: item.name,
            leverage: item.maxLeverage
        }));


        let previousAssets = [];

        if (fs.existsSync('assets.json')) {
            previousAssets = JSON.parse(fs.readFileSync('assets.json', 'utf-8'));
        }

        const newAssets = currentAssets.filter(curr =>
            !previousAssets.some(prev => prev.asset === curr.asset)
        );



        for (const asset of newAssets) {
            const msg = `🚨 *New Asset Available*\n\n🪙 *${asset.asset}*\n\nMax Leverage: ${asset.leverage}x\n[Trade on Hyperliquid](https://app.hyperliquid.xyz/trade/${asset.asset})`;
            console.log(msg);

            for (const id of chatIds) {
              await bot.sendMessage(id, msg, { parse_mode: 'Markdown' });
            }
        }

        fs.writeFileSync('assets.json', JSON.stringify(currentAssets, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

getMarkets();
setInterval(getMarkets, 2 * 60 * 1000);
