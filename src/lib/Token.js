const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

let Tokens = [
  {
    Token: "",
    TelegramID: 0,
    Scoped: "admin"
  },
  {
    Token: "",
    TelegramID: null,
    Scoped: "user"
  }
];

const BdsSettings = require("./BdsSettings");
const TokenFile = path.join(BdsSettings.BdsDir, "BdsToken.json");
const Save = () => fs.writeFileSync(TokenFile, JSON.stringify(Tokens, null, 2));
if (fs.existsSync(TokenFile)) Tokens = JSON.parse(fs.readFileSync(TokenFile, "utf8"));
else {
  Tokens = [];
  Save();
}

/**
 * Register new Token to Bds Maneger Core
 *
 */
function CreateToken(AdminScoped = "admin", TelegramID = null) {
  if (!(AdminScoped === "admin" || AdminScoped === "user")) throw new Error("Invalid Admin Scoped, valid use admin and user");
  const GetRandomUUID = crypto.randomUUID().split("-");
  const TokenObject = {
    Token: `BdsTks_${GetRandomUUID[0]}${GetRandomUUID[GetRandomUUID.length - 1]}`,
    TelegramID: TelegramID,
    Scoped: AdminScoped
  }
  Tokens.push(TokenObject);
  Save();
  return TokenObject;
}

/**
 * Delete Token
 */
function DeleteToken(Token = "") {
  if (!Token) throw new Error("Inform valid Token");
  if (!(Tokens.find(token => token.Token === Token))) throw new Error("this token not exists.");
  Tokens = Tokens.filter(token => token.Token !== Token);
  Save();
  return true;
}

/**
 * Check for is valid Token
 */
function CheckToken(Token = "", Scope = "admin") {
  if (!Token) throw new Error("Inform valid Token");
  if (!(Scope === "admin" || Scope === "user" || Scope === "all")) throw new Error("Invalid Scope, valid use admin and user");
  // Tmp Tokens
  let TmpTokens = Tokens;
  if (Scope !== "all") {
    if (Scope === "user") TmpTokens = TmpTokens.filter(token => token.Scoped === "user");
    else if (Scope === "admin") TmpTokens = TmpTokens.filter(token => token.Scoped === "admin");
  }
  // Check if Token exists
  if (TmpTokens.find(token => token.Token === Token)) return true;
  else return false;
}

/**
 * Update TelegramID for Token
 */
function UpdateTelegramID(Token = "", TelegramID = null) {
  if (!Token) throw new Error("Inform valid Token");
  if (!TelegramID) throw new Error("Inform valid TelegramID");
  if (!(CheckToken(Token, "all"))) throw new Error("this token not exists.");
  Tokens = Tokens.map(token => {
    if (token.Token === Token) token.TelegramID = TelegramID;
    return token;
  });
  Save();
  return;
}

/** */
function CheckTelegramID(TelegramID = null) {
  if (!TelegramID) throw new Error("Inform valid TelegramID");
  if (Tokens.find(token => token.TelegramID === TelegramID)) return true;
  else return false;
}

/**
 * Express Middleware to Check Token
 */
function ExpressCheckToken (req, res, next) {
  let TokenFinded = "";
  if (req.headers["authorizationtoken"]) TokenFinded = req.headers["authorizationtoken"];
  else if (req.query.token) TokenFinded = req.query.token;
  else if (req.headers.token) TokenFinded = req.headers.token;
  else if (req.query.Token) TokenFinded = req.query.Token;
  else if (req.headers.Token) TokenFinded = req.headers.Token;
  else if (req.body.token) TokenFinded = req.body.token;
  else if (req.body.Token) TokenFinded = req.body.Token;
  if (!TokenFinded) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Required Token"
    });
  } else {
    if (CheckToken(TokenFinded, "all")) return next();
    else return res.status(401).json({
      error: "Unauthorized",
      message: "Token is not valid"
    });
  }
}

// Export module
module.exports = {
  CreateToken,
  DeleteToken,
  CheckToken,
  ExpressCheckToken,
  UpdateTelegramID,
  CheckTelegramID,
  TokenFile,
  GetAllTokens: () => Tokens
}
