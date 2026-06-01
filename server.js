require("dotenv").config(); // env file load

const express = require("express"); // express import
const http = require("http"); // http server
const cors = require("cors"); // cors allow
const morgan = require("morgan"); // logger
const mongoose = require("mongoose");

const connectDB = require("./src/config/db"); // db connect
const chatRoutes = require("./src/routes/chat.routes"); // chat routes
const errorMiddleware = require("./src/middleware/error.middleware");
const optionalAuth = require("./src/middleware/optionalAuth.middleware");
const initSocket = require("./src/socket/socket"); // socket setup

const app = express(); // app create
const server = http.createServer(app); // http server create

initSocket(server); // socket start

// middleware
app.use(cors()); // cors enable
app.use(express.json({ limit: "5mb" })); // json allow
app.use(morgan("dev")); // log show
app.use(optionalAuth);

// routes
app.use("/api/chat", chatRoutes); // chat api

// health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
app.get("/live", (req, res) => {
  res.status(200).json({ status: "alive" });
});
app.get("/ready", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({ status: isConnected ? "ready" : "not_ready" });
});
app.use(express.static("src/public"));


// error middleware
app.use(errorMiddleware); // error handle

// db + server start
connectDB().then(() => {
  const PORT = process.env.PORT || 3000; // port set
  const runningServer = server.listen(PORT, () =>
    console.log(`Server running on ${PORT}`) // server start
  );

  const shutdown = (signal) => {
    console.log(`Received ${signal}, shutting down gracefully`);
    runningServer.close(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
});
