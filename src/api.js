const express = require("express");
const TokenManeger = require("./lib/Token");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const pretty = require("express-prettify");
const cors = require("cors");
const express_rate_limit = require("express-rate-limit");
const request_ip = require("request-ip");
const app = express();
app.use(cors());
app.use(bodyParser.json()); /* https://github.com/github/fetch/issues/323#issuecomment-331477498 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(pretty({always: true, spaces: 2}));
app.use(fileUpload({limits: { fileSize: 512 * 1024 }}));
app.use(request_ip.mw());
app.use(express_rate_limit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 500 // limit each IP to 500 requests per windowMs
}));

// Init Socket.io
const Server = require("http").createServer(app);
const SocketIo = require("socket.io");
const io = new SocketIo.Server(Server, {
  cors: {
    origin: "*"
  }
});
io.use(function (socket, next) {
  const { headers, query } = socket.handshake;
  const Token = headers["authorizationtoken"] || query["token"] || query["Token"];
  try {
    if (TokenManeger.CheckToken(Token, "all")) {
      socket.token = Token;
      return next();
    }
  } catch (e) {
    return next(e);
  }
  return next(new Error("Token is not valid"));
});
module.exports.SocketIO = io;

const BdsRoute = require("./api/ServerHost");
app.use("/", BdsRoute);

const PlayersRoute = require("./api/Players");
app.use("/players", TokenManeger.ExpressCheckToken, PlayersRoute);

const Plugins = require("./api/Plugins");
app.use("/plugins", TokenManeger.ExpressCheckToken, Plugins);

const ParseRoutes = (app, RootRoute="") => {
  const RoutesArray = [];
  for (const Route of [...(app.stack||[]), ...((app._router||{}).stack||[])]) {
    if (Route.route) {
      if (Route.route.path && typeof Route.route.path === "string") {
        if (Object.keys(Route.route.methods).length) {
          RoutesArray.push(`[${Object.keys(Route.route.methods)[0]}]: ${RootRoute}${Route.route.path}`);
        } else RoutesArray.push(`${RootRoute}`+Route.route.path);
      } else if (Route.route.paths && typeof Route.route.paths === "object") {
        let Method = null;
        if (Object.keys(Route.route.methods).length) Method = Object.keys(Route.route.methods)[0]
        for (let Path of Route.route.paths) {
          RoutesArray.push(`[${Method ? Method : "?"}]: ${RootRoute}${Path}`);
        }
      }
    } else if (Route.path && typeof Route.path === "string") RoutesArray.push(`${RootRoute}`+Route.path);
  }
  return RoutesArray;
}

/**
 * Launch an API To manage the server Remotely, some features are limited.
 */
function BdsApiListen(port_api = 3000, callback = (port = 0) => {return port;}){
  app.all("*", (req, res) => {
    const MapRoutes = ([
      ...(ParseRoutes(BdsRoute)),
      ...(ParseRoutes(Plugins, "/plugins")),
      ...(ParseRoutes(PlayersRoute, "/players")),
      ...(ParseRoutes(app)),
    ]).map(As => {const Data = {Method: "", Path: ""};As.replace(/\[(.*)\]: (.*)/gi, (_, Method, Path) => {Data.Method = Method; Data.Path = Path; return _;});return Data;});
    return res.status(404).json({
      error: "Not Found",
      message: `The requested URL ${req.originalUrl} was not found on this server.`,
      AvaibleRoutes: MapRoutes
    });
  });

  const port = (port_api || 3000);
  Server.listen(port, () => {
    if (typeof callback === "function") callback(port);
  });
  return;
}

module.exports.api = BdsApiListen;
module.exports.Listen = Server.listen;
module.exports.BdsRoutes = app;