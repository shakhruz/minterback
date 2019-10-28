// Telegram bot
console.log("bot.js")
const data = require('./data')
const ratesController = require('./controllers/ratesController.js')
const contractController = require('./controllers/contractController.js')

const Telegraf = require('telegraf')
const Markup = require("telegraf/markup")
const Stage = require("telegraf/stage")
const session = require("telegraf/session")
const extra = require('telegraf/extra')
const markup = extra.markdown()
const { enter, leave } = Stage

const rates = require('./rates.js')

const mode = data.MODE ? data.MODE : "DEVELOPMENT"
const BOT_TOKEN = data.MODE === "PRODUCTION" ? (data.BOT_TOKEN || "") : data.BOT_DEV_TOKEN
const bot = new Telegraf(BOT_TOKEN)
const URL = data.URL

// Настраиваем ТелеБота
var Express = require('express')
var router = Express.Router()
var app = Express()

app.use("/test", function (req, res) {
    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.end("Hello, World!\n\n💚 🔒.js")
})
app.use(router)

function startBot() {
    console.log(`startbot, bot token webhook: ${URL}/bot${BOT_TOKEN}`)
    if (mode === "PRODUCTION") {
        console.log("Стартуем в режиме сервера...")
        app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`))
        bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);

        require('greenlock-express').create({
            // Let's Encrypt v2 is ACME draft 11
            version: 'draft-11',
            server: 'https://acme-v02.api.letsencrypt.org/directory',
            email: 'shakhruz@gmail.com',
            approveDomains: ['minterx.io', 'www.minterx.io'],
            agreeTos: true,
            configDir: "~/acme/",
            app: app,
            communityMember: true,
            telemetry: true,
            store: require('greenlock-store-fs')
        }).listen(80, 443)
    } else {
        console.log("Стартуем в режиме разработки...")
        bot.telegram.setWebhook("")
        bot.launch()
    }
}
startBot()

// Start Bot
bot.start(ctx => {
    console.log("/start...")

    if (ctx.from.is_bot) {
        console.log("Тут какой-то бот пытается нас поюзать....")
        return
    }

    if (isAdmin(ctx.from.username)) {
        let keyboard_buttons = Markup.keyboard(["Информация"]).oneTime().resize().extra();
        ctx.replyWithMarkdown("Приветствуем Вас в MINTERX!", keyboard_buttons)
    } else {
        ctx.reply("бот в разработке...")
    }
})

bot.use(session())
bot.command("info", (ctx) => {
    showBalance(ctx)
})
bot.hears("Информация", (ctx) => {
    showBalance(ctx)
})

bot.command("pause", (ctx) => {
    if (isAdmin(ctx.from.username)) {
        console.log("pause exchange")
        contractController.setPaused(true);
        ctx.reply("обменник на паузе")
    }
})

bot.command("unpause", (ctx) => {
    if (isAdmin(ctx.from.username)) {
        console.log("unpause exchange")
        contractController.setPaused(false);
        ctx.reply("обменник снят с паузы")
    }
})

bot.hears(/\/bip_price.+/, ctx => {
    if (isAdmin(ctx.from.username)) {
        let args = ctx.message.text.split(' ')
        if (args.length > 1 && args[1]) {
            const price = parseFloat(args[1])
            if (price > 0 && price < 1) {
                console.log("Меняем цену на BIP: ", price)
                rates.setBIPPrice(price)
                rates.setAutoUpdate(false)
                ctx.reply("Ручное обновление цены на BIP, цена BIP: " + price)
            }
        }
    }
})

bot.command("auto_price", (ctx) => {
    if (isAdmin(ctx.from.username)) {
        console.log("set auto update for price")
        rates.setAutoUpdate(true);
        ctx.reply("Авто обновление цены на BIP")
    }
})

function showBalance(ctx) {
    console.log("Балансы счетов");
    if (isAdmin(ctx.from.username)) {
        ctx.reply("Баланс счетов:")
        ratesController.getAllBalances((result) => {
            ctx.reply(`BIP: ${result.BIP}\nBTC: ${result.BTC}\nETH: ${result.ETH}`)
        })
        const bip_prices = rates.getBIPPrices()
        ctx.reply(`bip prices: ${JSON.stringify(bip_prices, null, 2)}`)
        const usd_prices = rates.getUSDPrices();
        ctx.reply(`usd prices: ${JSON.stringify(usd_prices, null, 2)}`)
    }
}

function isAdmin(username) {
    return data.admins.indexOf(username) >= 0
}

function sendToAdmins(message, markdown = false) {
    admins_id.forEach(function (id) {
        if (markdown) bot.telegram.sendMessage(id, message, markup)
        else bot.telegram.sendMessage(id, message)
    })
}

function sendMessage(userId, message, markdown = false) {
    if (markdown) bot.telegram.sendMessage(userId, message, markup)
    else bot.telegram.sendMessage(userId, message)
}

function sendError(err, ctx) {
    console.log("Error: ", err.toString())
    if (ctx && ctx.from) {
        if (err.toString().includes('message is not modified')) {
            return
        }
        bot.telegram.sendMessage(data.dev, `❌Ошибка у [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) \n\nОшибка: ${err}`)
    }
}

module.exports = {
    sendToAdmins,
    sendMessage,
    sendError,
    isAdmin
}

// Визарды
// const buy_crypto_wizard = require('./wizards/buy_crypto_wizard.js')
// const stage = new Stage([buy_crypto_wizard.buy_crypto], { ttl: 300 });
// bot.use(stage.middleware())
// bot.action("buy_crypto", enter("buy_crypto"))
// bot.hears("buy", enter("buy_crypto"))
// bot.hears("💵🏎️✈️👨‍👧‍👧🌴 Продать БИТКОИН", (ctx) => {
//     sell_crypto(ctx)
// })

// bot.on('sticker', (ctx) => {
//     ctx.reply(`Код стикера - ${ctx.message.sticker.file_id}`)
// });
