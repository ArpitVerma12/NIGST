const sendMail = require("../mailing_Service/mailconfig");
const { v1: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const transporter = require("../mailing_Service/mailconfig");
const pool = require("../config/pool");
const generateNumericValue = require("../generator/NumericId");
const pg = require("pg");
const { default: axios } = require("axios");
const CryptoJS = require("crypto-js");

//session regeneration
exports.login = async (req, res) => {
  let client;

  try {
    const { email, password, recaptcha } = req.body;
    const keyDecryption = process.env.ENCRYPTION_KEY;

    const decryptedEmail = CryptoJS.AES.decrypt(email, keyDecryption).toString(
      CryptoJS.enc.Utf8
    );
    const decryptedPassword = CryptoJS.AES.decrypt(
      password,
      keyDecryption
    ).toString(CryptoJS.enc.Utf8);

    const recaptchaVerify = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.SITE_SECRET,
          response: recaptcha,
        },
      }
    );

    if (!recaptchaVerify.data.success) {
      return res.status(400).json({ message: "Invalid Captcha." });
    }

    client = await pool.connect();

    const userQuery = `SELECT email, student_id, organization, CONCAT(first_name, ' ', middle_name, ' ', last_name) AS name, email_verified, mobile_verified, admin_verified FROM users WHERE email = $1`;
    const userResult = await client.query(userQuery, [decryptedEmail]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = userResult.rows[0];

    if (!user.email_verified) {
      return res
        .status(200)
        .json({ message: "Email not verified", email: user.email });
    }

    if (!user.mobile_verified) {
      return res
        .status(200)
        .json({ message: "Mobile not verified", email: user.email });
    }

    if (!user.admin_verified) {
      return res
        .status(200)
        .json({ message: "Admin not verified", email: user.email });
    }

    const passwordQuery = `SELECT password FROM password WHERE email = $1`;
    const passwordResult = await client.query(passwordQuery, [decryptedEmail]);

    if (passwordResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const match = await bcrypt.compare(
      decryptedPassword,
      passwordResult.rows[0].password
    );
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const updateQuery = `UPDATE users SET updated_at = NOW() WHERE email = $1`;
    await client.query(updateQuery, [decryptedEmail]);

    const sessionUser = {
      id: user.student_id,
      name: user.name,
    };

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to regenerate session." });
      }

      req.session.user = sessionUser;
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to save session." });
        }

        const token = jwt.sign(
          { id: user.student_id },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.status(200).json({
          token,
          verification: user.email_verified,
          id: user.student_id,
          email: user.email,
          org: user.organization,
          name: user.name,
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error connecting to the server." });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

//without session regeneration
// exports.login = async (req, res) => {
//   let client;

//   try {
//     const { email, password, recaptcha } = req.body;
//     const keyDecryption = process.env.ENCRYPTION_KEY;

//     // Decrypt email and password
//     const decryptedEmail = CryptoJS.AES.decrypt(email, keyDecryption).toString(
//       CryptoJS.enc.Utf8
//     );
//     const decryptedPassword = CryptoJS.AES.decrypt(
//       password,
//       keyDecryption
//     ).toString(CryptoJS.enc.Utf8);

//     // Verify reCAPTCHA
//     const recaptchaVerify = await axios.post(
//       `https://www.google.com/recaptcha/api/siteverify`,
//       null,
//       {
//         params: {
//           secret: process.env.SITE_SECRET,
//           response: recaptcha,
//         },
//       }
//     );

//     if (!recaptchaVerify.data.success) {
//       return res.status(400).json({ message: "Invalid Captcha." });
//     }

//     client = await pool.connect();

//     // Fetch user details
//     const userQuery = `SELECT email, student_id, organization, CONCAT(first_name, ' ', middle_name, ' ', last_name) AS name, email_verified, mobile_verified, admin_verified FROM users WHERE email = $1`;
//     const userResult = await client.query(userQuery, [decryptedEmail]);

//     if (userResult.rows.length === 0) {
//       return res.status(401).json({ error: "Invalid email or password." });
//     }

//     const user = userResult.rows[0];

//     // Check if user already has an active session
//     if (req.session.user && req.session.user.id === user.student_id) {
//       return res.status(400).json({ message: "User already logged in." });
//     }

//     // Check verification status
//     if (!user.email_verified) {
//       return res
//         .status(400)
//         .json({ message: "Email not verified", email: user.email });
//     }

//     if (!user.mobile_verified) {
//       return res
//         .status(400)
//         .json({ message: "Mobile not verified", email: user.email });
//     }

//     if (!user.admin_verified) {
//       return res
//         .status(400)
//         .json({ message: "Admin not verified", email: user.email });
//     }

//     // Fetch and compare password
//     const passwordQuery = `SELECT password FROM password WHERE email = $1`;
//     const passwordResult = await client.query(passwordQuery, [decryptedEmail]);

//     if (passwordResult.rows.length === 0) {
//       return res.status(401).json({ error: "Invalid email or password." });
//     }

//     const match = await bcrypt.compare(
//       decryptedPassword,
//       passwordResult.rows[0].password
//     );
//     if (!match) {
//       return res.status(401).json({ error: "Invalid email or password." });
//     }

//     // Update user last login timestamp
//     const updateQuery = `UPDATE users SET updated_at = NOW() WHERE email = $1`;
//     await client.query(updateQuery, [decryptedEmail]);

//     // Prepare session user data
//     const sessionUser = {
//       id: user.student_id,
//       name: user.name,
//     };

//     // Regenerate session and save user data if no existing session
//     req.session.regenerate((err) => {
//       if (err) {
//         return res.status(500).json({ error: "Failed to regenerate session." });
//       }

//       req.session.user = sessionUser;
//       req.session.save((err) => {
//         if (err) {
//           return res.status(500).json({ error: "Failed to save session." });
//         }

//         // Create JWT token
//         const token = jwt.sign(
//           { id: user.student_id },
//           process.env.JWT_SECRET,
//           { expiresIn: "1h" }
//         );

//         // Respond with user details and token
//         res.status(200).json({
//           token,
//           verification: user.email_verified,
//           id: user.student_id,
//           email: user.email,
//           org: user.organization,
//           name: user.name,
//         });
//       });
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Error connecting to the server." });
//   } finally {
//     if (client) {
//       await client.release();
//     }
//   }
// };

exports.signUp = async (req, res) => {
  let studentId = "S-NIGST" + generateNumericValue(8);

  let client;
  try {
    const {
      fname,
      mname,
      lname,
      dob,
      phone,
      gender,
      email,
      password,
      organization,
      recaptcha,
    } = req.body;

    const recaptchaVerify = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.SITE_SECRET}&response=${recaptcha}`
    );

    if (recaptchaVerify.data.success === true) {
      client = await pool.connect();

      if (!password || password === "") {
        return res.status(400).send({ message: "Please provide a password" });
      }

      const checkQuery = "SELECT * FROM users WHERE email = $1";
      const result = await client.query(checkQuery, [email]);

      if (result.rowCount > 0) {
        return res.status(409).send({ message: "User already exists" });
      }

      const query2 = "SELECT * FROM users WHERE student_id = $1";
      let result2 = await client.query(query2, [studentId]);

      while (result2.rows.length !== 0) {
        studentId = "S-NIGST" + generateNumericValue(8);
        result2 = await client.query(query2, [studentId]);
      }

      const salt = await bcrypt.genSalt(16);
      const hashedPass = await bcrypt.hash(password, salt);

      const data = [
        fname,
        mname,
        lname,
        dob,
        phone,
        gender,
        email,
        organization,
      ];

      const insertQuery =
        "INSERT INTO users (first_name, middle_name, last_name, dob, phone, gender, email, organization, student_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)";
      const now = new Date();

      await client.query(insertQuery, [...data, studentId, now]);

      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      const url = `${process.env.URL}/secure/${token}`;

      const data2 = [email, hashedPass];
      const passQuery =
        "INSERT INTO password (email, password) VALUES ($1, $2)";

      await client.query(passQuery, data2);

      sendMail(
        `${req.body.email}`,
        "Please verify your email.",
        `<p>Hello ${req.body.fname} ${req.body.lname}, Thanks for registering with us. Please click below to verify your email.</p><br><a href=${url}><button style="color:white;background-color:#4CFA50;border-radius:8px;border:none;padding:auto;">Click Here to Verify Your Email</button></a>`
      );

      return res.status(201).send({
        message: "Verification email sent. Please check your email to verify.",
      });
    } else {
      return res.status(400).send({ message: "Invalid Captcha." });
    }
  } catch (error) {
    console.log(error);

    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "Mobile no. already registered." });
    } else if (error.code === "23502") {
      return res.status(400).json({ message: "Missing required field." });
    } else {
      return res.status(500).json({ message: "Internal Server Error!." });
    }
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.ForgotPassword = async (req, res) => {
  const { email } = req.body;

  let client;

  try {
    client = await pool.connect();

    const results = await client.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (results.rowCount === 0) {
      return res.status(404).json({ message: "Email not found" });
    } else {
      const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "30m",
      });

      const resetURL = `${process.env.URL_FRONT}#/reset/${resetToken}`;

      await client.query(
        "UPDATE password SET reset_token = $1 WHERE email = $2",
        [resetToken, email]
      );

      sendMail(
        `${email}`,
        "Password reset",
        `<p>You requested for password reset</p><h5>Click on this <a href=${resetURL}>link</a> to reset password</h5>`
      );

      return res.status(200).json({ message: "Reset token sent to email" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.passwordReset = async (req, res) => {
  let client;
  try {
    const { password, resetToken } = req.body;

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    const email = decoded.email;

    client = await pool.connect();

    const query = `SELECT * FROM password WHERE email = $1`;

    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    if (!resetToken || resetToken !== result.rows[0].reset_token) {
      return res.status(401).json({ message: "Invalid reset token" });
    }

    const salt = await bcrypt.genSalt(16);

    const hash = await bcrypt.hash(password, salt);

    const updatePassword =
      "UPDATE password SET password = $1, reset_token = NULL WHERE email = $2";

    await client.query(updatePassword, [hash, email]);

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).send("Token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).send("Invalid token");
    } else {
      return res.status(500).send({ message: "Password reset failed" });
    }
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.verifyEmail = async (req, res) => {
  let client;
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    client = await pool.connect();
    const queryText = "SELECT id, email_verified FROM users WHERE email = $1 ";
    const queryParams = [email];
    const result = await client.query(queryText, queryParams);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }

    if (result.rows[0].is_verified) {
      throw new Error("Email already verified");
    }

    const updateQuery =
      "UPDATE users SET email_verified = true WHERE email = $1 ";
    const updateResult = await client.query(updateQuery, queryParams);

    if (updateResult.rowCount > 0) {
      return res.status(200).send("Email verified successfully");
    } else {
      throw new Error("User not found");
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).send("Token expired");
    } else if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).send("Invalid token");
    } else {
      console.error(err);
      return res.status(401).send("Invalid email or registration number");
    }
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.sendVeriMailAgain = async (req, res) => {
  let connection;
  try {
    const email = req.body.email;
    connection = await pool.connect();
    const query = "SELECT first_name, last_name FROM users WHERE email = $1";
    const result = await connection.query(query, [email]);
    if (result.rows.length === 0) {
      return res.status(404).send({ error: "User not found!" });
    } else {
      const { first_name, last_name } = result.rows[0];
      const newToken = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "30m",
      });
      const url = `${process.env.URL}/secure/${newToken}`;
      sendMail(
        email,
        "Please verify your email",
        `
        <p>Hello ${first_name} ${last_name},</p>
        <p>Thanks for registering with us. Please click the link below to verify your email:</p>
        <a href="${url}">Verify Email</a>
      `
      );
      return res.status(200).send({ message: "Verification email sent." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Internal Server Error!" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

exports.viewVeriStatus = async (req, res) => {
  let client;
  try {
    const { email } = req.params;
    client = await pool.connect();
    const check =
      "SELECT email_verified, mobile_verified, admin_verified FROM users WHERE email = $1";
    const result = await client.query(check, [email]);
    if (result.rowCount === 0) {
      return res.status(404).send({ message: "User Not Found" });
    }
    return res.status(200).send({ data: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal Server Error!" });
  } finally {
    if (client) {
      await client.release();
    }
  }
};

exports.adminVerify = async (req, res) => {
  let client;
  try {
    const { email } = req.body;
    const check = "SELECT * FROM users WHERE email=$1";
    client = await pool.connect();
    const result = await client.query(check, [email]);
    if (result.rowCount === 0) {
      return res.send({ message: "User does not exist." });
    }
    const user = result.rows[0];

    const verify = "UPDATE users SET admin_verified=$1 WHERE email=$2";
    const data = [true, email];
    const data2 = [false, email];

    if (user.admin_verified) {
      await client.query("BEGIN");
      await client.query(verify, data2);
      await client.query("COMMIT");
      return res.send({ message: "Successfully unverified." });
    } else {
      await client.query("BEGIN");
      await client.query(verify, data);
      await client.query("COMMIT");
      return res.send({ message: "Successfully verified." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Internal server error." });
  } finally {
    if (client) {
      await client.release();
    }
  }
};
