/*
    NOTES:
    For gif command: https://github.com/austinkelleher/giphy-api
*/

const Eris = require('eris')
const path = require('path')
const fs = require('fs')

// Here you can change your bot prefix
const PREFIX  = ">";

// FAQ links for the faq command
// If you want to set own FAQ links, just add them here like following:
// "key": ["message", "title"],
// ...
const FAQS = {
    "addbot": ["[zekroBot - Get It](https://github.com/zekroTJA/DiscordBot#get-it)", "zekroBot Get It"],
    "supp": ["[Support Guideline](https://gist.github.com/zekroTJA/ced58eb57642acc1e0c39f010e33975d)", "Support Guidelines"],
    "userbots": ["Invite with: `!invite <botID>`\n[User Bot Rules](https://gist.github.com/zekroTJA/485972bbe3b607dee7c91278577be26c)", "Userbot Info"],
    "faq": ["[zekro FAQ](https://gist.github.com/zekroTJA/75d2da53b01a4c76db27ef6befbfabf6)", "zekro FAQ"]
}

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

const VERSION = "0.1.0";

console.log(`\hanekawaBot running on version ${VERSION}\n` + 
            `(c) 2017 Ringo Hoffman (zekro Development)` +
            `All rights reserved.\n\n` + 
            `Starting up and logging in...`);

/**
 * Reads the private account token out of the 'token.txt' file.
 * If it does not exists or the token has a invalid length, it will throw
 * an error message and stop the process.
 */
var token = fs.readFileSync('token.txt', 'utf8');
if (token.length < 15) {
    console.log("[ERROR] The entered token is invalid or could not be read!")
    process.exit(0);
}

// Here will be registered all commands
// Multiple registration of commands can be used as aliases
const COMMANDS = {
    "test": test,
    "game": game,
    "g": game,
    "status": status,
    "s": status,
    "embed": embed,
    "e": embed,
    "faq": faq
}


// Creating bot instance
const bot = new Eris(token);


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
    +-----------------+
    | C O M M A N D S |
    +-----------------+
*/


// Just a little testing command.
function test(msg, args) {
    sendEmbed(msg.channel, "test").then(m => console.log(m));
}

// With this command, you can change your game message.
function game(msg, args) {
    var gname = "";
    if (args.length > 0) {
        for (var ind in args)
            gname += args[ind];
    }
    bot.editStatus(msg.member.status, gname.length > 0 ? {name: gname} : null);
    sendEmbed(
        msg.channel, 
        gname.length > 0 ? `Changed game to \`${gname}\`.` : "Reset game.", 
        null, 
        gname.length > 0 ? Color.green : Color.gold
    ).then(m => setTimeout(() => bot.deleteMessage(m.channel.id, m.id), 3000));
}

// Send embeded messages
// use optional 'c::red' for example to specify the color (picked from 'Color' map)
// use optional 't::this_is_a_title' to specify embeds title (use '_' instead of spaces)
function embed(msg, args) {
    var color = null, title = null, content = "";
    for (var ind in args) {
        if (args[ind].startsWith("c::")) {
            clrstr = args[ind].substr(3);
            color = (clrstr in Color) ? Color[clrstr] : null;      
        }
        else if (args[ind].startsWith("t::")) {
            titlearr = args[ind].substr(3).split("_")
            title = "";
            for (var ind2 in titlearr)
                title += titlearr[ind2] + " ";
        }
        else
            content += args[ind] + " ";
    }
    if (content != "")
        sendEmbed(msg.channel, content, title, color);
}

// Change current status
// Setting the game may cause that if you chage your status in client, your status will
// not be updated for other ones. So you can reset or set your status independently of
// your client settings.
function status(msg, args) {
    var tostatus = args.length > 0 ? args[0].toLowerCase(): "";
    console.log(tostatus);
    if (["online", "idle", "dnd", "invisible"].indexOf(tostatus) > -1) {
        bot.editStatus(tostatus, msg.member.game);
        sendEmbed(msg.channel, `Changed status to \`${tostatus}\`.`, null, Color.green)
            .then(m => setTimeout(() => bot.deleteMessage(m.channel.id, m.id), 3000));
    } else {
        bot.editStatus(null, msg.member.game);
        sendEmbed(msg.channel, `Reset status.`, null, Color.green)
            .then(m => setTimeout(() => bot.deleteMessage(m.channel.id, m.id), 3000));
    }
}

// Just a little command for myself, because I often get a lot of the same question
// so I can quick send links with this command without searching them every time.
function faq(msg, args) {
    if (args[0] in FAQS)
        sendEmbed(msg.channel, FAQS[args[0]][0], FAQS[args[0]][1], Color.cyan);
    else if (args[0] == "list") {
        var out = "";
        for (var key in FAQS)
            out += `**\`${key}\`**  -  ${FAQS[key][1]}\n`
        sendEmbed(msg.channel, out, "FAQ links");
    }
}


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


// Connect bot
bot.connect().catch(err => console.log(`[ERROR] Logging in failed!\n ${err}`));