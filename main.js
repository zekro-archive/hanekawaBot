require('coffee-script/register');
const Eris = require('eris')
const path = require('path')
const fs = require('fs')
const cmds = require("./cmds.coffee")


var config = null;

// Getting config object from json file if existent
if (fs.existsSync("config.json")) {
    config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
} else {
    console.log("[ERROR] 'config.json' does not exists! Please download it from github repository!");
    process.exit(0);
}

// Initialize Token and Prefix from config
var token = config["token"];
var PREFIX  = config["prefix"];

// Initialize FAQS from config
var FAQS = {};
var conffaqs = config["FAQS"];
for (var ind in config["FAQS"]) {
    FAQS[conffaqs[ind]["invoke"]] = [conffaqs[ind]["content"], conffaqs[ind]["title"]]
}

// Initialize command invokes and aliases from config
var confcmds = config["commands"]

function bindCmd(invokes, cmdfunc) {
    for (var ind in invokes) {
        COMMANDS[invokes[ind]] = cmdfunc;
    }
}

var COMMANDS = {}

bindCmd(confcmds["game"], cmds.game);
bindCmd(confcmds["status"], cmds.status);
bindCmd(confcmds["embed"], cmds.embed);
bindCmd(confcmds["faq"], cmds.faq);
bindCmd(confcmds["gif"], cmds.gif);
bindCmd(confcmds["clear"], cmds.clear);

// Load giphy API token from config and give to exports
exports.giphyapitoken = config["giphyapitoken"];

// Just some color codes
const Color = {
    red:    0xe50202,
    green:  0x51e502,
    cyan:   0x02e5dd,
    blue:   0x025de5,
    violet: 0x9502e5,
    pink:   0xe502b4,
    gold:   0xe5da02,
    orange: 0xe54602
}

const VERSION = "0.2.0";

console.log(`\hanekawaBot running on version ${VERSION}\n` + 
            `(c) 2017 Ringo Hoffman (zekro Development)` +
            `All rights reserved.\n\n` + 
            `Starting up and logging in...`);


// Creating bot instance
const bot = new Eris(token);
// Giving bot instance to cmds script
cmds.setbot(bot);

/*
    +-------------------+
    | L I S T E N E R S |
    +-------------------+
*/

/**
 * Displays account name#discriminator and ID after successfull login
 */
bot.on('ready', () => {
    console.log(`Logged in successfully as account ${bot.user.username}#${bot.user.discriminator}.\n` + 
                `ID: ${bot.user.id}`);
});

/**
 * Message listener with command pasrer.
 * Checks if the message comes from bot client (because of discord self-bot rules).
 * Checks then if the command starts with the set prefix and is longer than the prefix.
 * Checks now if command is registered and executes the set function of the command.
 * Then the origin message will be deleted instantly.
 */
bot.on('messageCreate', (msg) => {
    if (msg.author == bot.user) {
        var cont = msg.content;
        if (cont.startsWith(PREFIX) && cont.length > PREFIX.length) {
            var invoke = cont.split(" ")[0].substr(PREFIX.length);
            var args = cont.split(" ").slice(1);
            if (invoke in COMMANDS) {
                COMMANDS[invoke](msg, args);
                bot.deleteMessage(msg.channel.id, msg.id, "");
            }
        }
    }
});


/*
    +----------------------+
    | E X T R A  F U N C S |
    +----------------------+
*/

/**
 * Sending an embed message.
 * @param {MessageChannel} chan 
 * @param {String} content 
 * @param {String} title 
 * @param {Number} clr
 * @returns Message
 */
function sendEmbed(chan, content, title, clr) {
    if (typeof title === "undefined")
        title = null;
    if (typeof color === "undefined")
        color = null;
    return bot.createMessage(chan.id, {embed: {title: title, description: content, color: clr}})
}

// Export configuration for other scripts
exports.sendEmbed = sendEmbed;
exports.color = Color;
exports.FAQS = FAQS;

// Connect bot
bot.connect().catch(err => console.log(`[ERROR] Logging in failed!\n ${err}`));