import mongoose from "mongoose";
export let authUsername = (!!process.env.MONGO_USER)?process.env.MONGO_USER:"public";
export let authPassword = (!!process.env.MONGO_PASSWORD)?process.env.MONGO_PASSWORD:"n0v8IBKEI920sfy8";
export const mongoURL = process.env.BDSVERSIONDB||`mongodb+srv://${authUsername}:${authPassword}@versionstorage.qgh8v.mongodb.net/v2_versions`;

// Connect to MongoDB
export const connection = mongoose.createConnection(mongoURL);
export default connection;
