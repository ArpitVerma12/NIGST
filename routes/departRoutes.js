const express = require("express");
const {
  organizationCourseAssi,
  otherCategory,
  courseAssi,
  idAssi,
  departAssi,
  viewOrganizations,
  viewAllOrganizations,
  viewdepartAssi,
  departments,
  removeOrganizationCourse,
} = require("../controllers/organization");
const { APILimiter } = require("../middleware/rateLimiter");
const sessionValidator = require("../middleware/sessionValidator");
const router = express.Router();

router.get(
  "/view",
  sessionValidator,

  viewAllOrganizations
);
router.get("/v", sessionValidator, viewOrganizations);
router.post(
  "/organization_assign",
  APILimiter,
  sessionValidator,
  organizationCourseAssi
);
router.get("/othercategory", sessionValidator, otherCategory);
router.get("/orgname", sessionValidator, courseAssi);
router.get("/idassi", sessionValidator, idAssi);
router.post("/departassi", sessionValidator, departAssi);
router.get("/viewda", sessionValidator, viewdepartAssi);
router.post("/d", sessionValidator, departments);
router.delete("/deassign", sessionValidator, removeOrganizationCourse);

module.exports = router;
