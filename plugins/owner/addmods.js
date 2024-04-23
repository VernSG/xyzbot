const fs = require('fs');
let handler = async(msg, { client, text }) => {
    if (!msg.hasQuotedMsg || !msg.mentionedIds) {
        msg.react("⚠");
        return msg.reply("Reply or tag user to add into mods!")
    }
    try {
        if (msg.hasQuotedMsg) {
            global.mods.push((await msg.getQuotedMessage()).author.split("@")[0]);
        } else {
            msg.mentionedIds.forEach(a => {
                global.mods.push(a.user);
            })
        }
        fs.writeFileSync("./roles.json", JSON.stringify(global.roles, null, 2))
        return msg.reply("User has been added into moderator list.")
    } catch {
        console.log(e);
        return msg.reply("A error occured, please try again later.")
    }
}

handler.help = ['addmods <tag or reply msg user>']
handler.tags = ['owner']
handler.command = /^(addmods)$/i
handler.owner = true;

module.exports = handler;