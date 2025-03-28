const express = require("express");
const { adminCreation, adminLogin } = require("./admincreation");
const { checkBlockedIP, IPlimiter } = require("../middleware/limiter");
const { ensureLoggedIn } = require("../middleware/sessionChecker");
const router = express.Router();
// router.use(limiter)
router.post("/create", adminCreation);
router.post("/login", checkBlockedIP, IPlimiter, adminLogin);
// router.get('/filter',adminFilter)

module.exports = router;
