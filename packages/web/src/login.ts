import express from "express";
// import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import { createToken, passwordCheck, passworldSc, createSSHKey, userCollection } from "./db.js";
import { pageRender } from "./reactServer.js";
import path from "node:path";

const app = express.Router();
export default app;

app.get("/login", (req, res) => {
  return pageRender(req, res, "/login");
});

app.get("/register", (req, res) => {
  return pageRender(req, res, "/register");
});

app.post("/api/login", async (req, res) => {
  if (typeof req.body !== "object") return res.status(400).json({ error: "Require body to login" });
  const existsUser = await userCollection.findOne({ $or: [{ username: req.body.username }, { email: req.body.username }] });
  if (!existsUser) return res.status(400).json({ error: "User not exists" });
  else if (!(await passwordCheck(existsUser, req.body.password))) return res.status(401).json({ error: "Invalid password" });
  req.session.userID = existsUser.ID;
  await new Promise<void>((done, reject) => req.session.save(err => err ? reject(err) : done()));
  return res.json({
    ID: existsUser.ID,
    createAt: existsUser.createAt,
    username: existsUser.username,
    permissions: existsUser.permissions,
  });
});

app.delete("/api/logout", async (req, res) => {
  if (typeof req.session.userID === "string") await new Promise<void>((done, reject) => req.session.destroy(err => err ? reject(err) : done()));
  return res.sendStatus(200);
});

app.post("/api/register", async (req, res) => {
  if (typeof req.body !== "object") return res.status(400).json({ error: "Require body to register user!" });
  const { username, email, password } = req.body;
  if (!(typeof username === "string" && typeof email === "string")) return res.status(400).json({ error: "Invalid username and email body" });
  else if (!(typeof password === "string" && (password.length >= 8))) return res.status(400).json({ error: "Require password with 8 characters" });
  else if (await userCollection.findOne({ email})) return res.status(400).json({ error: "email in use!" });
  else if (await userCollection.findOne({ username})) return res.status(400).json({ error: "username in use!" });
  const passEncrypt = await passworldSc(password);
  let ID: string;
  while (true) if (!(await userCollection.findOne({ ID: (ID = crypto.randomUUID()) }))) break;
  const token = await createToken();
  const sshKey = await createSSHKey();
  await userCollection.insertOne({
    ID, createAt: new Date(),
    email, username, password: passEncrypt,
    permissions: [
      "confirm"
    ],
    tokens: [token],
    sshKeys: [sshKey]
  });

  return res.status(201).json({
    ID,
    token,
    sshKey
  });
});

const deleteIDs = new Map<string, string>();
app.delete("/api/register", async (req, res) => {
  if (typeof req.session.userID !== "string") return res.status(400).json({ error: "Require login fist to delete account" });
  let deleteID: string;
  while (true) if (!(deleteIDs.has((deleteID = crypto.randomUUID())))) break;
  deleteIDs.set(deleteID, req.session.userID);
  const location = path.posix.join((new URL(req.url, "localhost.com")).pathname, deleteID);
  res.setHeader("Location", location);
  return res.status(201).json({
    deleteID
  });
});

app.delete("/api/register/:deleteID", async (req, res) => {
  if (!(deleteIDs.has(req.params.deleteID))) return res.status(400).json({ error: "Id not exists!" });
  else if (deleteIDs.get(req.params.deleteID) !== req.session.userID) return res.status(400).json({ error: "You do not have access to this ID" });
  const userInfo = await userCollection.findOneAndDelete({ ID: req.session.userID });
  deleteIDs.delete(req.params.deleteID);
  return res.json(userInfo.value);
});