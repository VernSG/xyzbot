module.exports = {
    async handler(client, messages) {
        if (!messages) return;

        // Filter users
        let chats = await messages.getChat();
        let users = await messages.getContact();

        let isGroup = messages.from.endsWith("@g.us");
        let groupMetadata = isGroup ? chats.groupMetadata : {};
        let participants = isGroup ? groupMetadata.participants : [];

        let user = isGroup ? participants.find(u => u.id.user == users.number) : {};
        let bot = isGroup ? participants.find(u => u.id.user == client.info.me.user) : {};

        let isAdmin = isGroup ? (user.isAdmin || user.isSuperAdmin) : false;
        let isBotAdmin = isGroup ? (bot.isAdmin || bot.isSuperAdmin) : false;

        if (messages.body.startsWith("!eval")) {
            try {
                evaled = await eval(messages.body.slice(6))
                if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
                messages.reply(evaled.toString())
            } catch (e) {
                messages.reply(e)
            }
        }

        // Simplified print messages
        try {
            require('./lib/print')(client, messages);
        } catch (e) {
            console.error(e);
        }
    }
}