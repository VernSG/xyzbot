require("./config.js");
var isNumber = (x) => typeof x === "number" && !isNaN(x);
module.exports = {
  async handler(client, msg) {
    if (!msg) return;
    let chats = await msg.getChat();
    let users = await msg.getContact();

    const Tnow = (new Date() / 1000).toFixed(0);
    const tlimit = Tnow - msg.timestamp;
    if (tlimit > 5000) return;

    try {
      let user = global.db.data.users[msg.author || msg.from] || {};
      user.name = users.pushname;
      user.afk = -1;
      user.afkReason = "";
      global.db.data.users[msg.author || msg.from] = user;
    } catch (e) {
      console.log("DatabaseError:", e);
    }

    let afkJids = [...(msg.mentionedIds || []), ...(msg.quoted ? await (await msg.getQuotedMessage()).mentionedIds : [])].filter(
      (jid, index, self) => index === self.findIndex((jid2) => jid2.split("@")[0] === jid.split("@")[0])
    );
    for (let jid of afkJids) {
      let users = global.db.data.users[jid._serialized] || {};
      if (!users.afk || users.afk < 0) continue;
      let reason = users.afkReason || '';
      msg.reply(`Dia tidak ada untuk saat ini. (selama ${clockString(new Date - users.afk)})\nAlasan : ${reason}`);
    }

    let isGroup = msg.from.endsWith("@g.us");
    let groupMetadata = isGroup ? chats.groupMetadata : {};
    let participants = isGroup ? groupMetadata.participants : [];
    let user = participants.find((u) => u.id._serialized == users.id._serialized);
    let bot = participants.find((u) => u.id.user == client.info.me.user);
    let isAdmin = isGroup ? user?.isAdmin || user?.isSuperAdmin : false;
    let isBotAdmin = isGroup ? bot?.isAdmin || bot?.isSuperAdmin : false;

    for (let name in global.plugins) {
      let plugin = global.plugins[name];
      if (!plugin) continue;
      let isAccept = plugin.command instanceof RegExp ? plugin.command.test(msg.body) : Array.isArray(plugin.command) ? plugin.command.includes(msg.body) : plugin.command === msg.body;
      if (!isAccept) continue;
      if (plugin.rowner && ![this.info.me.user, ...global.owner.map(([number]) => number)].includes(msg.from.split("@")[0])) continue;
      if (plugin.owner && ![this.info.me.user, ...global.owner.map(([number]) => number)].includes(msg.from.split("@")[0])) continue;
      if (plugin.admin && !isAdmin) continue;
      if (plugin.botAdmin && !isBotAdmin) continue;
      if (plugin.private && isGroup) continue;
      if (plugin.mods && !global.mods.includes(msg.from.split("@")[0])) continue;
      await plugin.call(this, msg, {
        msg,
        users,
        isGroup,
        isAdmin,
        isOwner: [this.info.me.user, ...global.owner.map(([number]) => number)].includes(msg.from.split("@")[0]),
        isMods: global.mods.includes(msg.from.split("@")[0]),
      });
    }

    if (msg.isCommand) {
      let user = global.db.data.users[msg.author || msg.from] || {};
      user.isOnCooldown = true;
      user.cooldownEndTime = new Date(Date.now() + 5000);
      setTimeout(() => {
        user.isOnCooldown = false;
        user.cooldownEndTime = null;
      }, 5000);
    }

    require("./lib/print").call(this, msg);
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
