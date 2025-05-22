require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const bot = new TelegramBot(process.env.TOKEN, { polling: true });
const PORT = process.env.PORT || 9000
const { fal } = require("@fal-ai/client");

fal.config({
    credentials: process.env.TRUMP
});


app.use(express.json());
app.use(express.urlencoded({ extended: true, }));
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', payload: "API" });
});


const commands = [
    { command: '/start', description: 'Start the bot' },
    { command: '/help', description: 'Display this help message' },
    { command: '/create', description: 'Generate an image based on the provided prompt' },
];

bot.setMyCommands(commands);

bot.onText(/\/start/, (msg) => {
    let name = msg.chat.first_name;
    const chatId = msg.chat.id;
    const welcomeMessage = `Hey ${name}! \n\nWelcome to Memeartai AI Image Generator Bot! Here are some commands you can use: \n\n - /start: Start the bot \n - /help: Display this help message  \n - /create: Generate an image from prompt /create kad < prompt > \n`;


    bot.sendMessage(chatId, welcomeMessage,);
});

bot.onText(/\/help/, (msg) => {
    let name = msg.chat.first_name;
    const chatId = msg.chat.id;
    const helpMessage = `Hey ${name}! \n\nWelcome to Memeartai AI Image Generator Bot! Here are some commands you can use: \n\n - /start: Start the bot \n - /help: Display this help message  \n - /create: Generate an image from prompt /create kad < prompt > \n`;



    bot.sendMessage(chatId, helpMessage,);
});


bot.onText(/\/create (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const prompt = match[1];
    const generatingMessage = await bot.sendMessage(chatId, "Generating...");

    try {
        const result = await fal.subscribe("fal-ai/flux-lora", {
            input: {
                prompt: prompt,
                model_name: null,
                loras: [{
                    path: "https://v3.fal.media/files/lion/rNzzbUh2xYtO3CXLNmdJC_pytorch_lora_weights.safetensors",
                    scale: 1
                }],
                embeddings: [],

                enable_safety_checker: false



            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map((log) => log.message).forEach(console.log);
                }
            },
        });

        const imageUrl = result.data.images[0].url;
        console.log(result.requestId);



        await bot.sendPhoto(chatId, imageUrl);



    } catch (err) {
        console.error(err);
        await bot.sendMessage(chatId, "Failed to generate image.");
    } finally {
        await bot.deleteMessage(chatId, generatingMessage.message_id);
    }
});










app.listen(PORT, () => {
    console.log('Bot listening on port ' + PORT)
});