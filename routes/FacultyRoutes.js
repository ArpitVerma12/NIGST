const express = require("express");
const { updateFacultyDetails } = require("../admin/edit");
const {
  facultyCreation,
  facultyPassForgot,
  facultyLogin,
  fPassReset,
  fChangePassword,
  facultyPosition,
  positionSend,
  officerFaculty,
  facultyPositionAssi,
  viewAllFacultyPositions,
  viewFaculty,
  reportSubmission,
  displayReport,
  filterReportsByFaculty,
  sendIDForReport,
  viewFacultyPositionAssi,
  facultyPositionReAssign,
  filterReportsByOfficer,
} = require("../controllers/facultyAuth");
const { uploadFacultyPhoto, reportSubmit } = require("../middleware/faculty");
const {
  IPlimiter,
  checkBlockedIP,
  LimitUpload,
} = require("../middleware/limiter");
const { APILimiter } = require("../middleware/rateLimiter");
const sessionValidator = require("../middleware/sessionValidator");
const router = express.Router();

router.post("/create", APILimiter, sessionValidator, facultyCreation);
router.post("/forget", facultyPassForgot);
router.post("/login", checkBlockedIP, IPlimiter, facultyLogin);
router.patch("/reset", fPassReset);
router.patch("/change", fChangePassword);
// router.patch('/update',uploadFacultyPhoto,updateFacultyDetails)
router.post("/position", APILimiter, sessionValidator, facultyPosition);
router.get("/send", sessionValidator, positionSend);
router.get("/officer/:profile", officerFaculty);
router.post("/possition_assi", APILimiter, facultyPositionAssi);
router.patch("/update_position", APILimiter, facultyPositionReAssign);
router.get("/view", sessionValidator, viewAllFacultyPositions);
router.get("/faculty_view", sessionValidator, viewFaculty);
router.post("/report/submit", LimitUpload, reportSubmit, reportSubmission);
router.get("/report/view/:scheduleId", sessionValidator, displayReport);
router.get(
  "/view_by_faculty/:faculty",
  sessionValidator,
  filterReportsByFaculty
);
router.get(
  "/view_by_officer/:facultyId",
  sessionValidator,
  filterReportsByOfficer
);
router.get("/send_course/:faculty", sessionValidator, sendIDForReport);
router.get(
  "/faculty_position/:faculty",
  sessionValidator,
  viewFacultyPositionAssi
);
module.exports = router;
