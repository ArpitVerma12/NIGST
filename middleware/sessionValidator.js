function sessionValidator(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if session has expired
  if (req.session.cookie.expires <= Date.now()) {
    // Session has expired, destroy it
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      return res.status(401).json({ error: "Session expired" });
    });
  } else {
    // Session is valid
    next();
  }
}

module.exports = sessionValidator;
