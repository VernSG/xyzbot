let handler = async (msg, { client, text }) => {
    var _participants = (await msg.getChat()).groupMetadata.participants
    if (_participants.id._serialized == msg.author && !_participants.isAdmin) return msg.reply("Administrator group only!")
    if (!msg.hasQuotedMsg) {
        msg.react("⚠");
        return msg.reply("Reply a message to pin!");
    }
    try {
        var pinTimeout = 86400; // 24 hour
        var participants = [];
        for (let users of _participants) {
            participants.push(users.id._serialized);
        }
        result = (await msg.getQuotedMessage()).pin(pinTimeout);
        if (result) {
            msg.react("✅");
            if (text.includes("loud")) {
                return msg.reply("I've pinned this message and mentioned everyone members.", msg.from, { mentions: participants })
            } else return msg.reply("I've pinned this message.")
        }
    } catch (e) {
        console.log(e)
        return msg.reply("A error occured, please try again later.")
    }
}

handler.help = ['pin <time> (default 24hour)'];
handler.tags = ['group'];
handler.command = /^(pin)$/i

module.exports = handler;