const express = require("express");
const {
  viewCourses,
  courseCreation,
  updateCourse,
  filterCourse,
  updateCourseStatus,
  changeCourseStatus,
  course_scheduling,
  viewScheduledCourses,
  sendCourseCodeNo,
  takeCodeNo,
  sendBatchAndInfo,
  courseCalender,
  viewScheduledCoursesByFaculty,
} = require("../controllers/courseController");
const { APILimiter } = require("../middleware/rateLimiter");
const sessionValidator = require("../middleware/sessionValidator");
const router = express.Router();

router.post("/creation", APILimiter, sessionValidator, courseCreation);
router.get("/view", sessionValidator, viewCourses);
router.get("/filter", sessionValidator, filterCourse);
router.post("/scheduler", APILimiter, sessionValidator, course_scheduling);
router.get("/view_scheduled", sessionValidator, viewScheduledCourses);
router.get("/view_code_no", sessionValidator, sendCourseCodeNo);
router.get("/send_course/:code/:no/:type", sessionValidator, takeCodeNo);
router.get("/send_batch_info/:courseID", sessionValidator, sendBatchAndInfo);
router.get("/calender", courseCalender);
router.get(
  "/view_scheduled_by_faculty/:faculty",
  sessionValidator,
  viewScheduledCoursesByFaculty
);

module.exports = router;
