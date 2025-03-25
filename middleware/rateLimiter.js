const RateLimit = require("express-rate-limit");
exports.APILimiter = RateLimit({
  windowMs: 2 * 60 * 1000,
  max: 5,
});
