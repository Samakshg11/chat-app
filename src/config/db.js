const mongoose = require("mongoose");

module.exports = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Mongo connected");
};
