require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { fal } = require('@fal-ai/client');

const TOKEN = process.env.TOKEN;
const FAL_KEY = process.env.TRUMP;
const PORT = process.env.PORT || 9000;

if (!TOKEN || !FAL_KEY) {
    console.error('❌  Missing TOKEN or TRUMP in .env');  // eslint-disable-line
    process.exit(1);
}

fal.config({ credentials: FAL_KEY });

const app = express();
const bot = new TelegramBot(TOKEN, { polling: true });

// ─────────────────  2. CONSTANTS  ─────────────────────
const LORA_STYLES = {
    monad: {
        path: 'https://v3.fal.media/files/rabbit/DXUTCNRAiEbEEsHnAF0_H_pytorch_lora_weights.safetensors',
        scale: 1,
        description: 'Monad Seals LoRA'
    },
    kad: {
        path: 'https://v3.fal.media/files/lion/rNzzbUh2xYtO3CXLNmdJC_pytorch_lora_weights.safetensors',
        scale: 1,
        description: 'Kad Lion LoRA'
    }
};

const COMMANDS = [
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Display this help message' },
    { command: 'create', description: 'Generate an image → /create <style> <prompt>' }
];

// ────────────────  3. EXPRESS MIDDLEWARE  ─────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (_, res) => res.json({ status: 'success', payload: 'API OK' }));

// ────────────────  4. TELEGRAM COMMANDS  ─────────────
bot.setMyCommands(COMMANDS);

const helpText = `✨ *Memeartai Image Generator*

/start – Start the bot  
/help  – Show this help  
/create <style> <prompt> – Generate an image  

*Styles available*: ${Object.keys(LORA_STYLES).join(', ')}

_Example_:  
/create monad astronaut surfing on a pizza in space`;

bot.onText(/\/start/, ({ chat }) => bot.sendMessage(chat.id, `Hey ${chat.first_name}! 👋\n\n${helpText}`, { parse_mode: 'Markdown' }));
bot.onText(/\/help/, ({ chat }) => bot.sendMessage(chat.id, helpText, { parse_mode: 'Markdown' }));

// ─────────────────  5. /create HANDLER  ───────────────
// bot.onText(/^\/create\s+(\w+)\s+(.+)/i, async (msg, match) => {
//     const chatId = msg.chat.id;
//     const styleKey = match[1].toLowerCase();
//     const prompt = match[2];

//     if (!LORA_STYLES[styleKey]) {
//         return bot.sendMessage(chatId, `❌ Unknown style *${styleKey}*.\nAvailable: ${Object.keys(LORA_STYLES).join(', ')}`, { parse_mode: 'Markdown' });
//     }

//     const waitMsg = await bot.sendMessage(chatId, '🪄 Generating your image, please wait…');

//     try {
//         const { path, scale } = LORA_STYLES[styleKey];

//         const result = await fal.subscribe('fal-ai/flux-lora', {
//             input: {
//                 prompt,
//                 model_name: null,
//                 loras: [{ path, scale }],
//                 embeddings: [],
//                 image_size: "square_hd",
//                 enable_safety_checker: false
//             },
//             logs: true,
//             onQueueUpdate: (u) => {
//                 if (u.status === 'IN_PROGRESS') u.logs?.forEach(l => console.log(l.message));
//             }
//         });

//         const imageUrl = result.data.images[0].url;
//         await bot.sendPhoto(chatId, imageUrl);
//     } catch (err) {
//         console.error(err);
//         await bot.sendMessage(chatId, '❌ Failed to generate image. Please try again later.');
//     } finally {
//         await bot.deleteMessage(chatId, waitMsg.message_id).catch(() => {/* ignore */ });
//     }
// });

// ────────────────────  6. START SERVER  ───────────────
app.listen(PORT, () => console.log(`🚀 Bot listening on port ${PORT}`));
