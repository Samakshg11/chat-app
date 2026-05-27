const mongoose = require("mongoose");
const { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } = require("../config/chat.constants");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const toObjectIdString = (value) => String(value);
const toObjectId = (value) => new mongoose.Types.ObjectId(toObjectIdString(value));

const parseSortOrder = (value) => {
  const normalizedOrder = typeof value === "string" ? value.toLowerCase() : "desc";
  if (normalizedOrder !== "asc" && normalizedOrder !== "desc") {
    return null;
  }
  return normalizedOrder;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value !== "string") {
    return false;
  }

  return ["true", "1", "yes"].includes(value.toLowerCase());
};

const getPagination = (page, limit) => {
  const safePage = Math.max(1, Number.parseInt(page, 10) || DEFAULT_PAGE);
  const safeLimit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(limit, 10) || DEFAULT_LIMIT));
  return { safePage, safeLimit };
};

module.exports = {
  getPagination,
  isValidObjectId,
  parseBoolean,
  parseSortOrder,
  toObjectId,
  toObjectIdString,
};
