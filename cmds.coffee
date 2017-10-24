main = require "./main.js"
# If you have a Giphy API key, please enter it here, -+
# because the public beta key may be not supportet    |
# later in time.                +---------------------+
#                               |
var giphy = require('giphy-api')();

bot = null
exports.setbot = (b) -> bot = b


# Just a command for testing purposes
exports.test = (msg, args) ->
    main.sendEmbed(msg.channel, "thats a test!")


# With this command, you can change your game ('now playing...' message)
exports.game = (msg, args) ->
    gname = ""
    if args.length > 0
        gname += s + " " for s in args
    bot.editStatus msg.member.status, if gname.length > 0 then {name: gname} else null
    main.sendEmbed msg.channel,
                   if gname.length > 0 then "Changed name to `#{gname}`." else "Reset game.",
                   null,
                   if gname.length > 0 then main.color.green else main.color.gold
        .then (m) -> setTimeout (-> bot.deleteMessage m.channel.id, m.id), 3000


### 
Send embeded messages
use optional 'c::red' for example to specify the color (picked from 'Color' map)
use optional 't::this_is_a_title' to specify embeds title (use '_' instead of spaces)
###
exports.embed = (msg, args) ->
    color = title = null
    content = ""
    for arg in args
        if arg.startsWith "c::"
            clrstr = arg.substr 3
            color = if clrstr of main.color then main.color[clrstr] else null
        else if arg.startsWith "t::"
            titlearr = arg.substr(3).split "_"
            title = ""
            title += s + " " for s in titlearr
        else
            content += arg + " "
    if content != ""
        main.sendEmbed msg.channel, content, title, color


###
Change current status
Setting the game may cause that if you chage your status in client, your status will
not be updated for other ones. So you can reset or set your status independently of
your client settings.
###
exports.status = (msg, args) ->
    tostatus = if args.length > 0 then args[0].toLowerCase() else ""
    if tostatus of ["online", "idle", "dnd", "invisible"]
        bot.editStatus tostatus, if msg.member.game == null then null else msg.member.game
        main.sendEmbed msg.channel, "Changed status to `#{tostatus}`", null, main.color.green
            .then (m) -> setTimeout (-> bot.deleteMessage m.channel.id, m.id), 3000
    else
        bot.editStatus null, if msg.member.game == null then null else msg.member.game
        sendEmbed msg.channel, "Reset status.", null, main.color.green
            .then (m) -> setTimeout (-> bot.deleteMessage m.channel.id, m.id), 3000


###
Just a little command for myself, because I often get a lot of the same question
so I can quick send links with this command without searching them every time.
###
exports.faq = (msg, args) ->
    if args[0] of main.FAQS
        main.sendEmbed msg.channel, main.FAQS[args[0]][0], main.FAQS[args[0]][1], main.color.cyan
    else if args[0] == "list"
        out = ""
        out += "**`#{key}`**  -  #{main.FAQS[key][1]}\n" for key of main.FAQS
        main.sendEmbed msg.channel, out, "FAQ links"


###
Super crazy advanced gif command to get crazy gifs from giphy.com
Select index of search by attaching '-index' to search query
For example: '>gif deal with it -1'
###
exports.gif = (msg, args) ->
    if args.length > 0
        query = ""
        index = 0
        query += " " + arg for arg in args
        if query.indexOf(" -") > -1
            indstr = query.substring query.indexOf(" -") + 2
            index = if parseInt indstr == NaN then 0 else parseInt indstr
            query = query.substring 0, query.indexOf " -"
        console.log query
        giphy.search query.substring(1), (err, res) ->
            if err
                main.sendEmbed msg.channel, "En error occured:\n```#{err}```", "Whoops...", main.color.red
                    .then (m) -> setTimeout (-> bot.deleteMessage m.channel.id, m.id), 4000
            else
                urls = []
                for ind of res["data"]
                    urls.push res["data"][ind]["url"]
                bot.createMessage msg.channel.id, urls[if index > urls.length - 1 or index < 0 then urls.length - 1 else index]


