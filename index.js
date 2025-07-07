const express = require("express");
const app = express();

const tiktokApiRouter = require("./api/tiktok.js");

app.get("/", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "Cannot GET /",
  });
});

app.use("/api/tt", tiktokApiRouter);

module.exports = app;
