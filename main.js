const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const syntaxerror = require("syntax-error");
const _ = require("lodash");
const Readline = require("readline");
const rl = Readline.createInterface(process.stdin, process.stdout);
const logger = require("pino")({
  transport: {
    target: "pino-pretty",
    options: {
      levelFirst: true,
      ignore: "hostname",
      translateTime: true,
    },
  },
}).child({ creator: "xyzuniverse" });
const cron = require("node-cron");

// Prevent to crash if error occured
process.on("uncaughtException", console.error);

// Plugin loader
const pluginFolder = path.join(__dirname, "plugins");
const pluginFilter = fs.readdirSync(pluginFolder, { withFileTypes: true }).filter((v) => v.isDirectory());
const pluginFile = (filename) => /\.js$/.test(filename);

global.plugins = {};
pluginFilter.forEach(({ name }) => {
  let files = fs.readdirSync(path.join(pluginFolder, name));
  for (let filename of files) {
    if (pluginFile(filename)) {
      global.plugins[filename] = require(path.join(pluginFolder, name, filename));
      fs.watch(path.join(pluginFolder, name, filename), global.reload);
    }
  }
});
logger.info("All plugins has been loaded.");

global.reload = async (_event, filename) => {
  if (!pluginFile(filename)) return;
  let subdirs = await fs.readdirSync(pluginFolder);
  let dir = subdirs.reduce((acc, files) => acc || path.join(pluginFolder, files, filename), "");
  if (!dir) return;
  if (dir in require.cache) {
    delete require.cache[dir];
    if (!fs.existsSync(dir)) {
      logger.warn(`deleted plugin '${filename}'`);
      return delete global.plugins[filename];
    }
  }
  let err = syntaxerror(fs.readFileSync(dir), filename);
  if (err) logger.error(`syntax error while loading '${filename}'\n${err}`);
  else {
    try {
      global.plugins = Object.assign({ [filename]: require(dir) }, global.plugins);
    } catch (e) {
      logger.error(e);
    }
  }
};
Object.freeze(global.reload);

// Bot prefix
global.prefix = new RegExp("^[" + "‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-".replace(/[|\\{}()[\]^$+*?.\-\^]/g, "\\$&") + "]");

// Database
var low;
try {
  low = require("lowdb");
} catch {
  low = require("./lib/lowdb");
}
const { Low, JSONFile } = low;
global.db = new Low(new JSONFile("database.json"));

// Roles
global.roles = JSON.parse(fs.readFileSync('./roles.json'))
global.mods = roles.mods

// Program paths
const browser = require('os').platform() === 'win32' ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : "/usr/bin/google-chrome-stable";

async function ClientConnect() {
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ["--no-sandbox", "--disable-gpu"],
      executablePath: browser,
      ignoreHTTPSErrors: true,
      headless: true,
      devtools: false,
    },
  });

  client.logger = logger;

  client.on("loading_screen", (percent) => {
    logger.info(`Connecting, loading web... Status: ${percent}%`);
  });

  client.on("qr", (qr) => {
    QRCode.generate(qr, { small: true });
    logger.info("Scan QR code to continue.");
  });

  client.on("ready", async () => {
    if (!global.db.data) await loadDatabase();
    logger.info("Opened connection to WA Web");
    logger.info("Client bot is ready!");
  });

  client.on("message", require("./handler").handler.bind(client));

  client.initialize();
  logger.info("Connecting to WA Web");

  return client;
}

// Load database if database didn't load properly
loadDatabase();
async function loadDatabase() {
  await global.db.read();
  global.db.data = {
    users: {},
    ...(global.db.data || {}),
  };
  global.db.chain = _.chain(global.db.data);
}

// Save database every minute
setInterval(async () => {
  try {
    await global.db.write();
  } catch {
    loadDatabase();
    await global.db.write();
  }
}, 30 * 1000);

// Readline
rl.on("line", (line) => {
  process.send(line.trim());
});

// Schedule for rebooting the bot
cron.schedule("0 0 * * *", () => {
  process.send("reset");
});

ClientConnect().catch((e) => console.error(e));
