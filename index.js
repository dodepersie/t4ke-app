const express = require("express");
const app = express();

const tiktokApiRouter = require("./api/tiktok.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/tt", tiktokApiRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running in http://localhost:${PORT}`);
});

module.exports = app;
