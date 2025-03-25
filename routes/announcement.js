const express = require("express");
const {
  createAnnouncement,
  archiveAnnouncement,
  retrieveAnnouncement,
} = require("../admin/create");
const { uploadAnnouncement } = require("../middleware/faculty");
const { viewAnnouncementToAdmin } = require("../admin/view");
const { editAnnouncementForPosting } = require("../admin/edit");
const { deleteArchiveAnnouncement } = require("../webview/announcement");
const { LimitUpload } = require("../middleware/limiter");
const { APILimiter } = require("../middleware/rateLimiter");
const sessionValidator = require("../middleware/sessionValidator");

const router = express.Router();

router.post("/create", LimitUpload, uploadAnnouncement, createAnnouncement);
router.post("/archive", APILimiter, archiveAnnouncement);
router.post("/retrieve", APILimiter, retrieveAnnouncement);
router.get("/view", sessionValidator, viewAnnouncementToAdmin);
router.patch("/edit", APILimiter, editAnnouncementForPosting);
router.delete("/delete", APILimiter, deleteArchiveAnnouncement);
module.exports = router;
