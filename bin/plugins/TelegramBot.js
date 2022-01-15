const { version, BdsSettings, BdsToken, BdsSystemInfo, BdsManegerServer } = require("../../src/index");
const { Telegraf } = require("telegraf");
const os = require("os");
const fs = require("fs");
const path = require("path");

// Set Telegram Bot
if (process.env.DOCKER_IMAGE === "true") {
  if (process.env.TelegramToken) BdsSettings.more.telegramToken(process.env.TelegramToken);
}

const { Yargs } = require("../BdsManeger");
Yargs.option("telegram", {
  describe: "Start Telegram Bot",
  alias: "t",
  type: "boolean",
  default: false
});

const TelegramToken = BdsSettings.more.telegramToken();
if (TelegramToken) {
  const bot = new Telegraf(TelegramToken);

  // Bot Start And Help messages
  const HelpAndStart = [
    "Hello, welcome to Bds Maneger Telegram Bot",
    "",
    "We are changing some things but everything is working!!",
    "Options:",
    "   /start or /help: This message!",
    "   ",
  ];
  bot.start((ctx) => ctx.reply(HelpAndStart.join("\n")));
  bot.help((ctx) => ctx.reply(HelpAndStart.join("\n")));

  // Info
  bot.command("info", async (ctx) => {
    const info = await BdsSystemInfo.SystemInfo();
    const reply = [
      `Bds Maneger Core Version: ${version}`,
      "Available Servers (Platfroms):",
      "",
      `Bedrock: ${info.valid_platform.bedrock ? "Avaible" : "Not Avaible"}`,
      `Java: ${info.valid_platform.java ? "Avaible" : "Not Avaible"}`,
      `Pocketmine-MP: ${info.valid_platform.pocketmine ? "Avaible" : "Not Avaible"}`,
      `Spigot: ${info.valid_platform.java ? "Avaible" : "Not Avaible"}`,
      `Dragonfly: ${info.valid_platform.dragonfly ? "Avaible" : "Not Avaible"}`,
    ];
    return ctx.reply(reply.join("\n"));
  });

  // Setup User Token
  bot.command("token", async (ctx) => {
    const AllTokens = BdsToken.GetAllTokens();
    const TextToken = ctx.message.text.replace(/\/token\s+/, "");
    if (AllTokens.length > 0) {
      if (!TextToken) return ctx.reply("Please, add your token");
      if (!BdsToken.CheckToken(TextToken)) return ctx.reply("Invalid Token");
      BdsToken.UpdateTelegramID(TextToken, ctx.message.from.id);
      return ctx.reply(`Token Associed to your account (You id: ${ctx.message.from.id})`);
    } else {
      ctx.reply("Please wait, we are setting up your fist token");
      const FistToken = BdsToken.CreateToken("admin", ctx.message.from.id);
      return ctx.reply(`Your fist token is: ${FistToken.Token}`);
    }
  });

  // Send Command to Servers
  bot.command("command", async (ctx) => {
    const user_id = ctx.message.from.id;
    if (ctx.message.from.is_bot) return ctx.reply("You can't send commands to servers");
    const command = ctx.message.text.replace(/^\/command\s+/i, "");
    if (!(BdsToken.CheckTelegramID(user_id))) return ctx.reply("You are not allowed to send commands to servers or is not setup you Token");
    const __Current_Sessions__ = BdsManegerServer.GetSessions();
    const SessionsArray = Object.keys(__Current_Sessions__)
    if (SessionsArray.length > 0) SessionsArray.forEach((key) => {
      __Current_Sessions__[key].SendCommand(command);
    }); else return ctx.reply("No Servers Running");
  });

  // Enable or Disable Player on connect
  let ReplyList = [];
  const TmpReplyList = path.join(os.tmpdir(), "ReplyList.json");
  const WriteTmpReplyList = () => fs.writeFileSync(TmpReplyList, JSON.stringify(ReplyList));
  if (fs.existsSync(TmpReplyList)) ReplyList = JSON.parse(fs.readFileSync(TmpReplyList));
  BdsManegerServer.RegisterPlayerGlobalyCallbacks((Actions) => {
    const MountText = [];
    Actions.forEach((action) => {
      MountText.push(`${action.Player} ${action.Action}`);
    });
    ReplyList.forEach((reply) => {
      return bot.telegram.sendMessage(reply.id, MountText.join("\n"));
    });
  });

  bot.command("player", ctx => {
    const ChatID = ctx.chat.id;
    if (ReplyList.find(User => User.id === ChatID)) {
      ReplyList = ReplyList.filter(User => User.id !== ChatID);
      ctx.reply("Player on connect disabled");
    } else {
      ReplyList.push({ id: ChatID });
      ctx.reply("Player on connect enabled");
    }
    WriteTmpReplyList();
  });

  // Get Catch
  bot.catch(console.log);

  if (Yargs.parse()["telegram"]) () => {
    console.log("Start Telegram Bot¹");
    return bot.launch()
  };
} else console.log("Telegram bot disabled");
