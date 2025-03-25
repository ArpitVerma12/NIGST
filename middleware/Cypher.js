// const crypto = require("crypto");

// function decryptFields(req, res, next) {
//   const key = "cipheryour_secret_key_32_chars_long"; // Replace with your actual encryption key
//   const iv = Buffer.alloc(16); // Initialization vector (IV) for AES, should be 16 bytes

//   // Decrypt username
//   if (req.body.username) {
//     try {
//       const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
//       let decrypted = decipher.update(req.body.username, "hex", "utf8");
//       decrypted += decipher.final("utf8");
//       req.body.username = decrypted;
//     } catch (error) {
//       return res
//         .status(400)
//         .json({ message: "Decryption failed", error: error.message });
//     }
//   }

//   // Decrypt password
//   if (req.body.password) {
//     try {
//       const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
//       let decrypted = decipher.update(req.body.password, "hex", "utf8");
//       decrypted += decipher.final("utf8");
//       req.body.password = decrypted;
//     } catch (error) {
//       return res
//         .status(400)
//         .json({ message: "Decryption failed", error: error.message });
//     }
//   }

//   next();
// }

// module.exports = decryptFields;
