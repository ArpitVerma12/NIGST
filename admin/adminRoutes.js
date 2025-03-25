const express = require("express");
const { viewContact } = require("../controllers/ContactController");
const {
  createFacultyMembership,
  assignSubjects,
  createFaculty,
  archiveAnnouncement,
} = require("./create");
const {
  viewStudents,
  viewAllStudents,
  viewFaculty,
  viewAllDetailsFaculty,
  organizationFilter,
  viewFacultyName,
  viewFacultyMembersWithFaculty,
  viewCourseByFaculty,
  viewAllEnrollment,
  viewAllCancelEnrollment,
  showReportsToAdmin,
  filter,
  viewArchiveAnnouncementToAdmin,
  viewCancelledCourses,
} = require("./view");
const {
  loginAccess,
  activeInactive,
  updateScheduling,
  updateFacultyDetails,
} = require("./edit");
const { deleteSchedulingCourse } = require("./delete");
const sessionValidator = require("../middleware/sessionValidator");
const {
  viewTenderToAdmin,
  viewCorriPdfToAdmin,
  viewArchiveCorriPdfToAdmin,
  viewArchiveTenderToAdmin,
  viewPdfToAdmin,
  viewImagesToAdmin,
  viewStudiesToAdmin,
  getBannerToAdmin,
} = require("./migratedViewToAdmin");
const router = express.Router();

router.get("/studentsView", sessionValidator, viewAllStudents);
router.post("/subassign", assignSubjects);
router.get("/contactview", sessionValidator, viewContact);
router.get("/organizationfilter", sessionValidator, organizationFilter);
router.post("/faculty_create", createFaculty);
router.get("/faculty_show", sessionValidator, viewFacultyName);
router.patch("/access", loginAccess);
router.patch("/act_inact_faculty", activeInactive);
router.get(
  "/faculty_member_faculty/:faculty",
  sessionValidator,
  viewFacultyMembersWithFaculty
);
router.get(
  "/delete/:status/:batch/:courseID",
  sessionValidator,
  deleteSchedulingCourse
);
router.patch("/updateSchedule", updateScheduling);
router.get("/course_faculty/:faculty", sessionValidator, viewCourseByFaculty);
router.get("/view_all_enrol", sessionValidator, viewAllEnrollment);
router.get("/view_all_cancelenrol", sessionValidator, viewAllCancelEnrollment);
router.get("/all_reports", sessionValidator, showReportsToAdmin);
router.get("/filter", sessionValidator, filter);
router.patch("/archive_ann", archiveAnnouncement);
router.get(
  "/show_archive_admin",
  sessionValidator,
  viewArchiveAnnouncementToAdmin
);
router.patch("/update_faculty", updateFacultyDetails);
router.get("/view_cancelled/:faculty", sessionValidator, viewCancelledCourses);
router.get("/view", sessionValidator, viewTenderToAdmin);
router.get("/corri_pdf/:corrigendumID", sessionValidator, viewCorriPdfToAdmin);
router.get(
  "/ar_corri_pdf/:corrigendumID",
  sessionValidator,
  viewArchiveCorriPdfToAdmin
);
router.get("/view_archive", sessionValidator, viewArchiveTenderToAdmin);
router.get("/vpdf/:tender_number", sessionValidator, viewPdfToAdmin);

router.get("/view_images", sessionValidator, viewImagesToAdmin);
router.get("/view_studies", sessionValidator, viewStudiesToAdmin);
router.get("/view_banner", sessionValidator, getBannerToAdmin);

module.exports = router;
