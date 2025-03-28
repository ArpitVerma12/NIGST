const pool = require("../config/pool");
const bcrypt = require("bcryptjs");
const generateNumericValue = require("../generator/NumericId");
const jwt = require("jsonwebtoken");
const ErrorLogger = require("../middleware/debugger");
const CryptoJS = require("crypto-js");
const { default: axios } = require("axios");

exports.adminCreation = async (req, res) => {
  let client;

  try {
    const { username, phone, email, password, role, faculty } = req.body;

    const validRoles = ["NIGST Admin", "Faculty Admin"];

    if (!validRoles.includes(role)) {
      throw new Error(
        "Invalid role. Only NIGST Admin, Faculty Admin are allowed."
      );
    }

    client = await pool.connect();

    const query1 = "SELECT * FROM admin WHERE username=$1 OR email=$2";

    const result = await client.query(query1, [username, email]);

    if (result.rows.length !== 0) {
      throw new Error("UserName or email already exists.");
    }

    let adminId = "A-NIGST-" + generateNumericValue(5);

    const query2 = "SELECT * FROM admin WHERE admin_id = $1";

    let result2 = await client.query(query2, [adminId]);

    while (result2.rows.length !== 0) {
      adminId = "A-NIGST-" + generateNumericValue(5);

      result2 = await client.query(query2, [adminId]);
    }

    const salt = await bcrypt.genSalt(16);

    const hashedPass = await bcrypt.hash(password, salt);

    const data = [username, phone, email, hashedPass, adminId, role, faculty];

    const query3 =
      "INSERT INTO admin (username, phone, email, password, admin_id, role,faculty) VALUES ($1, $2, $3, $4, $5, $6,$7)";

    await client.query(query3, data);

    return res.send({ message: "Admin successfully created." });
  } catch (error) {
    ErrorLogger(error);

    return res
      .status(500)
      .send({ error: error.message || "Internal Server Error." });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.adminLogin = async (req, res) => {
  let client;

  try {
    const { email, password, captcha, username } = req.body;
    const keyDecription = process.env.ENCRYPTION_KEY;

    const decryptedEmail = CryptoJS.AES.decrypt(
      username,
      keyDecription
    ).toString(CryptoJS.enc.Utf8);
    const decryptedPassword = CryptoJS.AES.decrypt(
      password,
      keyDecription
    ).toString(CryptoJS.enc.Utf8);

    // const recaptchaVerify = await axios.post(
    //   `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.SITE_SECRET}&response=${captcha}`
    // );
    // if (recaptchaVerify.data.success !== true) {
    //   return res.status(401).json({ message: "Invalid Captcha" });
    // }

    client = await pool.connect();

    const query = "SELECT * FROM admin WHERE email = $1 OR username = $2";
    const result = await client.query(query, [email, decryptedEmail]);
    // console.log("email", decryptedEmail);
    // console.log("pass", decryptedPassword);
    // console.log("result", result.rows);
    if (
      result.rows.length === 0 ||
      !bcrypt.compareSync(decryptedPassword, result.rows[0].password)
    ) {
      return res
        .status(401)
        .json({ error: "Wrong email/username or password." });
    }

    const user = {
      id: result.rows[0].admin_id,
      type: result.rows[0].role,
      faculty: result.rows[0].faculty,
    };

    if (req.session.user && req.session.user.id === user.id) {
      return res.status(400).json({ message: "User already logged in" });
    }

    // console.log("Before Session Regeneration - Session ID:", req.sessionID);
    // console.log("Before Session Regeneration - Session Data:", req.session);

    req.session.regenerate((err) => {
      if (err) {
        throw err;
      }

      // console.log(
      //   "After Session Regeneration - New Session ID:",
      //   req.sessionID
      // );
      // console.log(
      //   "After Session Regeneration - New Session Data:",
      //   req.session
      // );

      req.session.user = user;
      req.session.save((err) => {
        if (err) {
          ErrorLogger(err);
          return res.status(500).json({ error: "Failed to save session." });
        }
      });

      // console.log("After Setting User - Session ID:", req.sessionID);
      // console.log("After Setting User - Session Data:", req.session);

      const data = { id: result.rows[0].admin_id };
      const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: "1h" });
      const type = result.rows[0].role;
      const faculty = result.rows[0].faculty;

      return res.status(200).send({
        message: "Login successful.",
        token,
        type,
        faculty,
        // id: user.id,
      });
    });
  } catch (error) {
    ErrorLogger(error);
    return res.status(500).send({
      error: "Server Error.",
      message: "An unexpected error occurred.",
    });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

// exports.adminLogin = async (req, res) => {
//   let client;

//   try {
//     const { email, password, username } = req.body;
//     client = await pool.connect();

//     const query = "SELECT * FROM admin WHERE email = $1 OR username=$2";
//     const result = await client.query(query, [email, username]);

//     if (result.rows.length === 0 || !bcrypt.compareSync(password, result.rows[0].password)) {

//       return res.status(401).json({ error: "Wrong email/username or password." });
//     }

//     const data = {
//       id: result.rows[0].admin_id,
//     };

//     const token = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '1h' });
//     const type = result.rows[0].role;
//     const faculty = result.rows[0].faculty;

//     return res.status(200).send({ message: "Login successful.", token, type, faculty });
//   } catch (error) {
// ErrorLogger(error)
//     return res.status(500).send({ error: 'Server Error.', message: 'An unexpected error occurred.' });
//   } finally {
//     if (client) {
//       await client.release();
//     }
//   }
// };

// exports.adminFilter = async (req, res) => {

//   let client

//   try {

//      client = await pool.connect()

//     const { admin_id } = req.body

//     const query = `SELECT username, role from admin where admin_id = $1`

//     const result = await client.query(query, [admin_id])

//     if (result.rowCount === 0) {
//       res.send(
//         { message: 'nothing to show' }
//       )
//     }
//     res.send(result.rows)
//     await client.release()

//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ error: "Something went wrong." });
//   }
// }
