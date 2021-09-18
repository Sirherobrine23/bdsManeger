// Node Internal modules
const path = require("path");
const fs = require("fs");
const os = require("os");

// Bds Manager Core modules
const BdsCore = require("../../../../index");

// Express
const express = require("express");
const app = express.Router();

// Routes
app.get("/", (req, res) => {
    res.send("Hello World!");
});
