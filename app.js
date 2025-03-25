const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
var hpp = require("hpp");
dotenv.config();
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);

const app = express();

app.use(helmet());
app.use(hpp());
app.disable("x-powered-by");
app.use(helmet.xssFilter({ setOnOldIE: true }));
app.set("trust proxy", 1);

const coursec = require("./routes/coursesRoutes");
const psauth = require("./routes/psRoutes");
const cat = require("./routes/courseCategoryRoute");
const fAuth = require("./routes/FacultyRoutes");
const contact = require("./routes/ContactRoute");
const enrol = require("./routes/EnrollRoutes");
const announcement = require("./routes/announcement");
const web = require("./webview/webRoutes/webRoutes");
const admin = require("./admin/adminRoutes");
const visit = require("./routes/vcount");
const superadmin = require("./remote/admincreationroutes");
const gallery = require("./routes/albumRoutes");
const depart = require("./routes/departRoutes");
const smsv = require("./routes/smsRoutes");
const tender = require("./routes/tenderRouter");
const pool = require("./config/pool");

// const Knex = require("knex");
// const KnexConfig = require("./config/KnexConfig");
// const KnexSessionStore = require("connect-session-knex")(session);

app.use(
  cors({
    origin: [
      "http://nigst.site",
      "http://admin.nigst.site",
      "https://nigst.site",
      "https://admin.nigst.site",
    ],
    credentials: true,
  })
);

// app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use((req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
app.use(
  express.json({
    limit: "30mb",
    extended: true,
  })
);

app.use(
  express.urlencoded({
    limit: "30mb",
    extended: true,
  })
);

app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true, // Mitigate risk of client side script accessing the protected cookie
      secure: false, // Use secure cookies in production and set to true
    },
  })
);

// const knex = Knex(KnexConfig);

// const store = new KnexSessionStore({
//   knex: knex,
//   tablename: "sessions", // optional. Defaults to 'sessions'
//   createTable: true, // optional. If true, it will create the sessions table if it doesn't exist
// });

// app.use(
//   session({
//     store: store,
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       maxAge: 24 * 60 * 60 * 1000, // 1 day
//       httpOnly: true, // Mitigate risk of client-side script accessing the protected cookie
//       secure: process.env.NODE_ENV === "production", // Use secure cookies in production
//     },
//   })
// );

app.use(hpp());
app.use("/course", coursec);
app.use("/secure", psauth);
app.use("/category", cat);
app.use("/sauth", fAuth);
app.use("/enrollment", enrol);
app.use("/announcement", announcement);
app.use("/viewweb", web);
app.use("/contact", contact);
app.use("/admin", admin);
app.use("/viscount", visit);
app.use("/sadmin", superadmin);
app.use("/gallery", gallery);
app.use("/dep", depart);
app.use("/sms", smsv);
app.use("/tender", tender);

app.post("/logout", async (req, res) => {
  try {
    if (!req.session.user) {
      return res
        .status(400)
        .send({ message: "No active session. User already logged out." });
    }

    delete req.session.user;

    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    res.clearCookie("connect.sid");
    return res.status(200).send({ message: "Logout successful." });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      error: "Server Error.",
      message: "An unexpected error occurred while logging out.",
    });
  }
});

module.exports = app;
