const express = require("express");
const app = express();

const tiktokApiRouter = require("./api/tiktok.js");

app.get("/", (req, res) => {
  res.status(200).send("Can't GET /");
});

app.use("/api/tt", tiktokApiRouter);

module.exports = app;
