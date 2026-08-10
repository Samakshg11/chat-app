const express = require("express");
const path = require("path");

const app = express();

// Set environment
app.set("env", process.env.NODE_ENV || "development");

app.use(express.json());

// simple request logging
app.use((req, res, next) => {
	console.info(`[req] ${req.method} ${req.originalUrl}`);
	next();
});

// serve frontend
app.use(express.static(path.join(__dirname, "../public")));

// Helpful startup log when required by server
console.info(`[app] environment: ${app.get("env")}`);

module.exports = app;
