main = require "./main.js"

giphy = if main.giphyapitoken != "" then require('giphy-api')(main.giphyapitoken) else require('giphy-api')()

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
        giphy.search query.substring(1), (err, res) ->
            if err
                main.sendEmbed msg.channel, "En error occured:\n```#{err}```", "Whoops...", main.color.red
                    .then (m) -> setTimeout (-> bot.deleteMessage m.channel.id, m.id), 4000
            else
                urls = []
                for ind of res["data"]
                    urls.push res["data"][ind]["url"]
                bot.createMessage msg.channel.id, urls[if index > urls.length - 1 or index < 0 then urls.length - 1 else index]


###
Tricky command to purge your own messages in chat.
This is currently limited to 20 messages at one, because I don't know if you will get
busted for that and recomment to don't overuse this command at all.
This command collects all messages in a range by 100 messages and puts all messages from
this bot account into an array. Then, message by message, the bot will try to delete the messages.
Because only real bots can use the command purge endpoint, I need to solve it like this. :/
###
exports.clear = (msg, args) ->
    count = if args.length < 1 then 1 else (if parseInt(args[0]) == NaN then 1 else parseInt(args[0]))
    # Change here message clear limit AT YOUR OWN RISK
    #          \/
    if count > 20
        main.sendEmbed msg.channel,
                       """
                       This command is limited to maximum 20 messages, because we don't recommend purging so much messages at once.\n\n
                       If you want to increase the limit of this command **at your own risk**, you can do this in the `cmds.coffee` script.
                       """,
                       "Limit exceeded", main.color.red
            .then (m) -> setTimeout (-> bot.deleteMessage m.channel.id, m.id), 7000
    else
        yourmsgs = []
        bot.getMessages msg.channel.id, 100
            .then (msgs) ->
                for m in msgs
                    if m.author == bot.user
                        yourmsgs.push m
                count = if count >= yourmsgs.length then yourmsgs.length - 1 else count
                for m in msgs[1..count]
                    try bot.deleteMessage msg.channel.id, m.id
                    catch e then console.log "Failed cleaning message. Mission permissions?"