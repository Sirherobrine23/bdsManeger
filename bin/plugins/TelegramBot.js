const fs = require("fs");
const { Telegraf, Markup } = require("telegraf");
const bds = require("../../index");
const { GetPlatform, GetPaths, GetTelegramToken, UpdateTelegramToken } = require("../../lib/BdsSettings");
const { GetKernel, arch, system } = require("../../lib/BdsSystemInfo");
const { Detect } = require("../../src/CheckKill");
const { CheckTelegramUser } = require("../../src/UsersAndtokenChecks");
const BdsInfo = require("../../BdsManegerInfo.json");

// Bot Start And Help messages
const HelpAndStart = [
  "Hello, welcome to Bds Maneger Telegram Bot",
  "",
  "We are changing some things but everything is working!!",
  "Options:",
  "   /start or /help: This message!",
  "   /basic",
  "     start, stop, backup",
  "   /live_log",
  "     enabler, disabler",
  "   /live_log",
  "   /download",
  "     Version",
  "   ",
];

// Set Telegram Bot
const bot = new Telegraf(GetTelegramToken());

// Start and Help Command
bot.start((ctx)=>ctx.reply(HelpAndStart.join("\n")));
bot.help((ctx)=>ctx.reply(HelpAndStart.join("\n")));

// User
bot.command("player", ctx => {
  // Check admin Username
  if (!(CheckTelegramUser(ctx.from.username))) return ctx.reply("you are not an administrator");
  
  const Server = global.ServerExec;
  const CtxOption = ctx.message.text.replace("/player", "").trim();
  const CtxContext = CtxOption.replace(/^kick|^deop|^ban|^op/, "").trim();
  if (CtxOption) {
    const Players = CtxContext.split(/, |,/gi).filter(a => a.trim());
    console.log(Players);
    if (/kick/.test(CtxOption)){
      if (Players.length >= 1) {
        Players.forEach(Player => {
          Server.kick(Player);
          ctx.reply(`${Player} was kicked`);
        });
      } else ctx.reply("and the Players?")
    }
    else if (/deop/.test(CtxOption)){
      if (Players.length >= 1) {
        Players.forEach(Player => {
          Server.deop(Player);
          ctx.reply(`${Player} was deopped`);
        });
      } else ctx.reply("and the Players?")
    }
    else if (/ban/.test(CtxOption)){
      if (Players.length >= 1) {
        Players.forEach(Player => {
          Server.ban(Player);
          ctx.reply(`${Player} was banned`);
        });
      } else ctx.reply("and the Players?")
    }
    else if (/op/.test(CtxOption)){
      if (Players.length >= 1) {
        Players.forEach(Player => {
          Server.op(Player);
          ctx.reply(`${Player} was opped`);
        });
      } else ctx.reply("and the Players?")
    }
    else if (/list/.test(CtxOption)){
      const Player_Json_path = GetPaths("player");
      let Players_Json = JSON.parse(fs.readFileSync(Player_Json_path, "utf8"))[GetPlatform()];
      const new_players = {};
      Players_Json.forEach(Player => {
        console.log(Player);
        if (new_players[Player.Player]) {
          new_players[Player.Player].push([`Action: ${Player.Action}`, `Date: ${Player.Date}`].join("\n"));
        } else {
          new_players[Player.Player] = [
            [`Player: ${Player.Player}`, `Action: ${Player.Action}`, `Date: ${Player.Date}`].join("\n")
          ]
        }
      });
      console.log(new_players);
      Object.getOwnPropertyNames(new_players).forEach(Player_Array => {
        let Length = Math.abs(new_players[Player_Array].length - 5);
        let Player = new_players[Player_Array].slice(0, Length).join("\n")
        ctx.reply(Player);
      });
    }
    else ctx.reply("Invalid option")
  } else {
    const ReplyOption = Markup.keyboard([
      "/player kick",
      "/player deop",
      "/player ban",
      "/player op",
      "/player list",
    ]).oneTime().resize();
    ctx.reply("Player Options:", ReplyOption);
  }
});

// Basic server
bot.command("basic", async ctx => {
  // Check admin Username
  if (!(CheckTelegramUser(ctx.from.username))) return ctx.reply("you are not an administrator");

  const text = ctx.message.text.replace("/basic", "").trim();
  if (text) {
    // Start Server
    if (/start/.test(text)) {
      if (Detect()) ctx.reply("Stop Server");
      else {
        try {
          const Server = bds.start();
          Server.log(function (data){
            for (let stx of global.LiveLog) stx.reply(data);
          });
          global.ServerExec = Server;
          return ctx.reply("Server Started")
        } catch (err) {
          console.log(err)
          ctx.reply("We couldn't start the server")
          ctx.reply(err.toString());
        }
      }
    }
    // Stop Server
    else if (/stop/.test(text)) {
      if (Detect()) {
        try {
          bds.stop()
          ctx.reply("Stopping your server")
        } catch (err) {
          ctx.reply("We had an error for your server");
          ctx.reply(err.toString());
        }
      } else ctx.reply("Your server is stopped")
    }
    // Backup
    else if (/backup/.test(text)) {
      const Backup = bds.backup();
      ctx.replyWithDocument({
        source: Backup.Buffer,
        filename: Backup.file_name,
      })
    }
    // Invalid option
    else return ctx.reply("Invalid option, they are just: start, stop")
  } else {
    await ctx.deleteMessage();
    const Options = Markup.keyboard([
      "/basic start",
      "/basic stop",
      "/basic backup",
    ]).oneTime().resize();
    ctx.reply("Basic Options", Options);
  }
});

// Select Platform
bot.command("platform", async ctx => {
  // Check admin Username
  if (!(CheckTelegramUser(ctx.from.username))) return ctx.reply("you are not an administrator");

  const text = ctx.message.text.replace("/platform", "").trim();
  if (text) {
    try {
      bds.BdsSettigs.UpdatePlatform(text);
      return ctx.reply(`Platform update to ${text}`)
    } catch (err) {
      ctx.reply("We were unable to change the platform")
      return ctx.reply(err.toString())
    }
  } else {
    await ctx.deleteMessage();
    const Keyboard = Markup.keyboard([
      "/platform bedrock",
      "/platform java",
      "/platform pocketmine",
      "/platform jsprismarine"
    ]).oneTime().resize();
    ctx.reply("Select Platform", Keyboard)
  }
});

// Download Server
bot.command("download", async ctx => {
  // Check admin Username
  if (!(CheckTelegramUser(ctx.from.username))) return ctx.reply("you are not an administrator");

  const version = ctx.message.text.replace(/\/download|[a-zA-Z]/gi, "").trim();
  if (version) {
    await bds.download(version, true);
    ctx.reply(`Sucess install ${GetPlatform()} with version ${version}`);
  } else {
    await ctx.deleteMessage();
    const KeyboardVersion = Markup.keyboard(Object.getOwnPropertyNames((await (await fetch(BdsInfo.Fetchs.servers)).json())[GetPlatform()]).map(version => {
      return {
        text: `/download ${version}`
      }
    })).oneTime().resize();
    ctx.reply("Select Version to Install", KeyboardVersion);
  }
});

// Command
bot.command("command", async ctx => {
  // Check admin Username
  if (!(CheckTelegramUser(ctx.from.username))) return ctx.reply("you are not an administrator");

  const text = ctx.message.text.replace("/command", "").trim();
  if (!(Detect())) return ctx.reply("Your server is stopped");
  if (text) {
    try {
      global.ServerExec.command(text);
    } catch (err) {
      ctx.reply("We couldn't execute the command");
      ctx.reply(`${err}`);
    }
  } else {
    await ctx.deleteMessage();
    return ctx.reply("/command <command>");
  }
});

// Send Info
bot.command("info", ctx => {
  const config = bds.get_config();
  const InfoRes = [
    `Bds Maneger core version: ${bds.package_json.version}`,
    `Kernel: ${GetKernel()}`,
    `Arch: ${arch}`,
    `System:  ${system}`,
    `Platform: ${GetPlatform()}`,
    `World_name: ${config.world}`,
    `Running: ${bds.detect()}`,
    `Port_V4: ${config.portv4}`,
    `Port_V6: ${config.portv6}`,
    `Max_players: ${config.players}`,
    `Whitelist: ${config.whitelist}`,
  ]
  ctx.reply(InfoRes.join("\n\n"));
});

// Live Log User
global.LiveLog = [];
bot.command("live_log", async ctx => {
  // Check admin Username
  if (!(CheckTelegramUser(ctx.from.username))) return ctx.reply("you are not an administrator");

  const option = ctx.message.text.replace("/live_log", "").trim();
  if (option) {
    if (/enable/.test(option)) {
      global.LiveLog.push(ctx);
      return ctx.reply("Sucess");
    } else if (/disable/.test(option)) {
      // ctx.from.id
      for (let ctx_Logs in global.LiveLog) {
        if (global.LiveLog[ctx_Logs].from.id === ctx.from.id) {
          delete global.LiveLog[ctx_Logs];
          global.LiveLog = global.LiveLog.filter(a=>a);
          return ctx.reply("Ok");
        }
      }
      return ctx.reply("You are not in the list");
    }
  }
  await ctx.deleteMessage();
  const ReplyOption = Markup.keyboard([
    "/live_log enable",
    "/live_log disable",
  ]).oneTime().resize();
  ctx.reply("Enable/Disabled?", ReplyOption);
});

// text
bot.on("text", ctx => {
  console.log(ctx.message.text);
  if (!(/\/.*/gi.test(ctx.message.text))) global.ServerExec.command(`say ${ctx.message.text}`)
});

// catch
bot.catch(console.log);

module.exports.description = "Start Bot of Telegram";
module.exports.Args = [
  {
    arg: "t",
    main: async () => bot.launch()
  },
  {
    arg: "telegram",
    main: async () => bot.launch()
  },
  {
    arg: "register_telegram_token",
    main: async (Token = "") => {
      if (!(Token && typeof Token === "string")) throw new Error("Token is not a string");
      return UpdateTelegramToken(Token);
    }
  }
];
module.exports.help = [
  "   -t, --telegram             Start Telegram Bot"
];