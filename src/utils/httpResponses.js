const badRequest = (res, message) => res.status(400).json({ message });
const forbidden = (res, message) => res.status(403).json({ message });
const notFound = (res, message) => res.status(404).json({ message });

module.exports = {
  badRequest,
  forbidden,
  notFound,
};
