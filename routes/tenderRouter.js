const express = require("express");
const {
  tenderCreation,
  archiveTender,
  retrieveTender,
  viewTender,
  getTenderNo,
  downloadPdf,
  viewPdf,
  addCorrigendum,
  viewCorriPdf,
  viewArchiveTender,
  viewArchivePdf,
  editTender,
  deleteArchiveTender,
  viewArchiveCorriPdf,
} = require("../controllers/tender");
const { tenderpdf, corrigendum } = require("../middleware/faculty");
const { LimitUpload } = require("../middleware/limiter");
const sessionValidator = require("../middleware/sessionValidator");
const router = express.Router();
router.post("/create", LimitUpload, tenderpdf, tenderCreation);
router.patch("/edit", sessionValidator, tenderpdf, editTender);
router.patch("/archive", sessionValidator, archiveTender);
router.post("/retrieve", sessionValidator, retrieveTender);
router.get("/view", viewTender);
router.post(
  "/corrigendum",
  LimitUpload,
  sessionValidator,
  corrigendum,
  addCorrigendum
);
router.get("/corri_pdf/:corrigendumID", viewCorriPdf);
router.get("/ar_corri_pdf/:corrigendumID", viewArchiveCorriPdf);
router.get("/refNo", sessionValidator, getTenderNo);
router.get("/vpdf/:tender_number", viewPdf);
router.get("/view_archive", viewArchiveTender);
router.get("/view_archive/:tender_number", viewArchivePdf);
router.get("/dpdf/:id", downloadPdf);
router.delete("/delete_archive", sessionValidator, deleteArchiveTender);
module.exports = router;
