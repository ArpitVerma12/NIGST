const express = require("express");
const { viewAlbumByCategory, deleteAlbum } = require("../controllers/album");
const { APILimiter } = require("../middleware/rateLimiter");
// const {  getPhotosByCategory, uploadPhoto } = require("../controllers/galleryController")
// const { galleryUpload } = require("../middleware/faculty")
const router = express.Router();

// router.post('/upload',galleryUpload,uploadPhoto)
// router.get('/album/:category',getPhotosByCategory)

router.patch("/album_view_category", APILimiter, viewAlbumByCategory);
router.delete("/delete_album", deleteAlbum);

module.exports = router;
