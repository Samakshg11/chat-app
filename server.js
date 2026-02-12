require("dotenv").config(); // env file load

const express = require("express"); // express import
const http = require("http"); // http server
const cors = require("cors"); // cors allow
const morgan = require("morgan"); // logger

const connectDB = require("./src/config/db"); // db connect
const chatRoutes = require("./src/routes/chat.routes"); // chat routes
const errorMiddleware = require("./src/middleware/error.middleware");
const initSocket = require("./src/socket/socket"); // socket setup

const app = express(); // app create
const server = http.createServer(app); // http server create

initSocket(server); // socket start

// middleware
app.use(cors()); // cors enable
app.use(express.json({ limit: "5mb" })); // json allow
app.use(morgan("dev")); // log show

// routes
app.use("/api/chat", chatRoutes); // chat api

// health check
app.use(express.static("src/public"));


// error middleware
app.use(errorMiddleware); // error handle

// db + server start
connectDB().then(() => {
  const PORT = process.env.PORT || 5000; // port set
  server.listen(PORT, () =>
    console.log(`Server running on ${PORT}`) // server start
  );
});
