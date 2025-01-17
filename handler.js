require("./config.js");
var isNumber = (x) => typeof x === "number" && !isNaN(x);
module.exports = {
  async handler(msg) {
    if (!msg) return;
    let chats = await msg.getChat();
    let users = await msg.getContact();

    // Auto clear chat if chats has reach the limit
    try {
      let chat_messages = await client.getChatById(chats.id._serialized);
      let totalChat = await chat_messages.fetchMessages();
      if (totalChat.length > 200) {
        // If the chat reach the limit, you can change more or less than this
        client.logger.info(`Chat ${chats.id._serialized} has reached the limit, clearing messages.`);
        chats.clearMessages();
      }
    } catch (e) {
      console.error(e);
    }

    // Prevent to load older msgs
    const Tnow = (new Date() / 1000).toFixed(0);
    const tlimit = Tnow - msg.timestamp;
    if (tlimit > 5000) return logger.info(`Message 5 seconds ago has been skipped to prevent spamming.`);

    try {
      // Database
      try {
        let user = global.db.data.users[msg.author || msg.from];
        if (typeof user !== "object") global.db.data.users[msg.author || msg.from] = {};
        if (user) {
          if (!("name" in user)) {
            user.name = users.pushname;
            user.afk = -1;
            user.afkReason = "";
          } 
        } else
          global.db.data.users[msg.author || msg.from] = {
            name: users.pushname,
            afk: -1,
            afkReason: ""
          };
      } catch (e) {
        console.log("DatabaseError:", e);
      }

      // AFK
      let afkUser = global.db.data.users[msg.author || msg.from]
      if (afkUser.afk > -1) {
        msg.reply(`Selamat datang kembali, ${afkUser.name}!\nAnda kembali ke chat setelah afk selama ${clockString(new Date - afkUser.afk)}.\nAlasan : ${afkUser.afkReason ? boldItalic(afkUser.afkReason) : ''}`)
        afkUser.afk = -1
        afkUser.afkReason = ''
      }
      let afkJids = [...new Set([...(msg.mentionedIds || []), ...(msg.quoted ? [await (await msg.getQuotedMessage()).mentionedIds] : [])])]
      for (let jid of afkJids) {
        let users = global.db.data.users[jid._serialized]
        if (!users) continue
        let afkTime = users.afk
        if (!afkTime || afkTime < 0) continue
        let reason = users.afkReason || ''
        msg.reply(`Dia tidak ada untuk saat ini. (selama ${clockString(new Date - afkUser.afk)})\nAlasan : ${reason}`)
      }

      // Plugin midman (prevent users to running the plugins)
      let isGroup = msg.from.endsWith("@g.us");
      let isROwner = [this.info.me.user, ...global.owner.map(([number]) => number)]
        .map((v) => v?.replace(/[^0-9]/g, ""))
        .includes((isGroup ? msg.author : msg.from).split("@")[0]);
      let isOwner = isROwner || msg.fromMe;
      let isMods = global.mods.includes((isGroup ? msg.author : msg.from).split("@")[0]);

      let groupMetadata = isGroup ? chats.groupMetadata : {};
      let participants = isGroup ? groupMetadata.participants : [];

      let user = isGroup ? participants.find((u) => u.id._serialized == users.id._serialized) : {};
      let bot = isGroup ? participants.find((u) => u.id.user == client.info.me.user) : {};

      let isAdmin = isGroup ? user.isAdmin || user.isSuperAdmin : false;
      let isBotAdmin = isGroup ? bot.isAdmin || bot.isSuperAdmin : false;

      // Plugin manager, and executor
      let usedPrefix;
      for (let name in global.plugins) {
        let plugin = global.plugins[name];
        if (!plugin) continue;
        const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
        let _prefix = plugin.customPrefix ? plugin.customPrefix : client.prefix ? client.prefix : global.prefix;
        let match = (
          _prefix instanceof RegExp // RegExp Mode?
            ? [[_prefix.exec(msg.body), _prefix]]
            : Array.isArray(_prefix) // Array?
            ? _prefix.map((p) => {
                let re =
                  p instanceof RegExp // RegExp in Array?
                    ? p
                    : new RegExp(str2Regex(p));
                return [re.exec(msg.body), re];
              })
            : typeof _prefix === "string" // String?
            ? [[new RegExp(str2Regex(_prefix)).exec(msg.body), new RegExp(str2Regex(_prefix))]]
            : [[[], new RegExp()]]
        ).find((p) => p[1]);
        if ((usedPrefix = (match[0] || "")[0])) {
          let noPrefix = msg.body.replace(usedPrefix, "");
          let [command, ...args] = noPrefix.trim().split` `.filter((v) => v);
          args = args || [];
          let _args = noPrefix.trim().split` `.slice(1);
          let text = _args.join` `;
          command = (command || "").toLowerCase();
          let isAccept =
            plugin.command instanceof RegExp // RegExp Mode?
              ? plugin.command.test(command)
              : Array.isArray(plugin.command) // Array?
              ? plugin.command.some((cmd) =>
                  cmd instanceof RegExp // RegExp in Array?
                    ? cmd.test(command)
                    : cmd === command
                )
              : typeof plugin.command === "string" // String?
              ? plugin.command === command
              : false;

          if (!isAccept) continue;
          msg.plugin = name;

          // Throw the message if didn't meet the required roles.
          if (plugin.rowner && !isROwner) {
            msg.reply("This command can only executed by the real owner!");
            continue;
          }
          if (plugin.owner && !isOwner) {
            msg.reply("This command can only executed by the owner.");
            continue;
          }
          if (plugin.admin && !isAdmin) {
            msg.reply("This command can only executed by the administrators.");
            continue;
          }
          if (plugin.botAdmin && !isBotAdmin) {
            msg.reply("Make sure bot is admin before executing this command!");
            continue;
          }
          if (plugin.private && isGroup) {
            msg.reply("This commnd can only executed on private chat.");
            continue;
          }
          if (plugin.mods && !isMods) {
            msg.reply("This command can only executed by the moderators.");
            continue;
          }

          msg.isCommand = true;

          // Cooldown handling
          if (global.db.data.users[msg.author || msg.from].isOnCooldown && !isOwner) {
            const currentTime = new Date();
            const remainingTime = global.db.data.users[msg.author || msg.from].cooldownEndTime - currentTime;
            const remainingSeconds = Math.ceil(remainingTime / 1000);
            msg.reply(`You're on cooldown. Please wait ${remainingSeconds} seconds.`);
            continue;
          }

          let extra = {
            match,
            usedPrefix,
            noPrefix,
            _args,
            args,
            command,
            text,
            client: this,
            msg,
            users,
            isGroup,
            isAdmin,
            isOwner,
            isMods
          };
          try {
            await plugin.call(this, msg, extra);
          } catch (e) {
            console.log(e);
          }
        }
      }
    } finally {
      if (msg.isCommand) {
        let user = global.db.data.users[msg.author || msg.from];
        user.isOnCooldown = true;
        user.cooldownEndTime = new Date(Date.now() + 5000); // 5 seconds cooldown
        // Clear the cooldown after 5 seconds
        setTimeout(() => {
          user.isOnCooldown = false;
          user.cooldownEndTime = null;
        }, 5000); // 5 seconds cooldown
      }
      // Simplified printed chat
      require("./lib/print")(this, msg).catch((e) => console.log(e));
    }
  },
};

function clockString(ms) {
  let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000);
  let m = isNaN(ms) ? "--" : Math.floor(ms / 60000) % 60;
  let s = isNaN(ms) ? "--" : Math.floor(ms / 1000) % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, 0)).join(":");
}

const bold = (string) => {
  return '*' + string + '*';
}
const monospace = (string) => {
  return '```' + string + '```'
}
const boldItalic = (string) => {
  return '*_' + string + '_*'
}
