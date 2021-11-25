const fs = require("fs");
const crypto = require("crypto");

let Tokens = [
  {
    Token: "",
    Email: "",
    TelegramID: null,
    Scoped: "admin"
  },
  {
    Token: "",
    Email: "",
    TelegramID: "",
    Scoped: "user"
  }
];

/*
const TokenFile = BdsSettings
const Save = () => fs.writeFileSync(TokenFile, JSON.stringify(Tokens, null, 2));
if (fs.existsSync(TokenFile)) Tokens = JSON.parse(fs.readFileSync(TokenFile, "utf8"));
else {
  Tokens = [];
  Save();
}
*/

/**
 * Register new Token to Bds Maneger Core
 *
 */
function CreateToken(Email = "", TelegramID = null, AdminScoped = "admin") {
  if (!Email) throw new Error("Required Email");
  if (!/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(Email)) throw new Error("Email is invalid");
  if (Tokens.find(a => a.Email === Email)) throw new Error("this Email is already in use.");
  if (!(AdminScoped === "admin" || AdminScoped === "user")) throw new Error("Invalid Admin Scoped, valid use admin and user");
  const GetRandomUUID = crypto.randomUUID().split("-");
  const TokenObject = {
    Token: `BdsTks_${GetRandomUUID[0]}${GetRandomUUID[GetRandomUUID.length - 1]}`,
    Email: Email,
    TelegramID: TelegramID,
    Scoped: AdminScoped
  }
  Tokens.push(TokenObject);
  return TokenObject;;
}

/**
 * Delete Token
 */
function DeleteToken(Token = "") {
  if (!Token) throw new Error("Inform valid Token");
  if (!(Tokens.find(token => token.Token === Token))) throw new Error("this token not exists.");
  Tokens = Tokens.filter(token => token.Token !== Token);
  return true;
}

/**
 * Check for is valid Token
 */
function CheckToken(Token = "", RequiredPrivilegied = true) {
  if (!Token) throw new Error("Inform valid Token");
  let TmpTokens = Tokens;
  if (RequiredPrivilegied) TmpTokens = TmpTokens.filter(token => token.Scoped === "admin");
  if (TmpTokens.find(token.Token === Token)) return true; else return false;
}

// Export module
module.exports = {
  CreateToken,
  DeleteToken,
  CheckToken
}
