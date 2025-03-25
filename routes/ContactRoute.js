const express = require("express");
const {
  postContact,
  viewContact,
  createOffice,
  sendOffice,
  editVisibility,
  editDetails,
  sendOfficeToAdmin,
  deleteOffice,
} = require("../controllers/ContactController");
const sessionValidator = require("../middleware/sessionValidator");
const router = express.Router();

router.post("/v0", postContact);
router.get("/contact_view", sessionValidator, viewContact);
router.post("/create_office", sessionValidator, createOffice);
router.get("/office_view", sessionValidator, sendOffice);
router.get("/office_aview", sessionValidator, sendOfficeToAdmin);
router.patch("/edit_visi", sessionValidator, editVisibility);
router.patch("/edit_office", sessionValidator, editDetails);
router.delete("/delete_office", sessionValidator, deleteOffice);

module.exports = router;
