const express = require("express");
const session = require("express-session");

exports.ensureLoggedIn = (req, res, next) => {
  if (req.session.user) {
    console.log(req.session.user);
    return res.status(400).json({ message: "User already logged in" });
  }
  next();
};
