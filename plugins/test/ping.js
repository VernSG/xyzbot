let handler = async (msg, { client }) => {
  msg.react("🏓");
  msg.reply("Pong! Our bot is alive!");
};

handler.command = /^(ping)$/i;
module.exports = handler;
