const express = require("express");
const {
  courseCategoryCreation,
  viewCategoryList,
  addCodeToCategory,
  addNumberToCategory,
  getCodeByCategory,
  getNumberByCategory,
} = require("../controllers/CategoryCreation");
const { APILimiter } = require("../middleware/rateLimiter");
const sessionValidator = require("../middleware/sessionValidator");
const router = express.Router();

router.post("/create", APILimiter, sessionValidator, courseCategoryCreation);
router.get("/view_category", viewCategoryList);
router.post("/add_code", APILimiter, sessionValidator, addCodeToCategory);
router.post("/add_no", APILimiter, sessionValidator, addNumberToCategory);
router.patch("/get_code", sessionValidator, getCodeByCategory);
router.patch("/get_no", sessionValidator, getNumberByCategory);

module.exports = router;
