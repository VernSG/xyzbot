const os = require("os");

module.exports = {
  name: "stats",
  description: "Show bot statistics, including uptime and memory usage.",
  execute: async (msg, { bot }) => {
    try {
      const uptimeInSeconds = process.uptime();
      const uptime = formatTime(uptimeInSeconds);

      const memoryUsage = process.memoryUsage();
      const usedMemory = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
      const totalMemory = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);

      const platform = os.platform();
      const architecture = os.arch();
      const cpuCount = os.cpus().length;

      const statsMessage = `
// Bot Statistics: //

- *Uptime:* ${uptime}
- *Memory Usage:* ${usedMemory} MB / ${totalMemory} MB
- *Platform:* ${platform} (${architecture})
- *CPU Count:* ${cpuCount}

Owner: xyzuniverse
Contributor: VernSG
      `.trim();

      return msg.reply(statsMessage);
    } catch (err) {
      console.error(err);
      return msg.reply("Error: Unable to retrieve bot statistics.");
    }
  },
};

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}
