import { body, validationResult } from "express-validator";
import express from "express";
import passport from "passport";
import passportLocal from "passport-local";
import User from "../models/User.js";
import Complaint from "../models/complaint.js";
import ComplaintMapping from "../models/complaint-mapping.js";

const router = express.Router();
const LocalStrategy = passportLocal.Strategy;

// ===== Helper Middleware =====
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash("error_msg", "Please login to access this page");
  res.redirect("/login");
};

// ===== Authentication Strategies =====
passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passReqToCallback: true,
    },
    async (req, username, password, done) => {
      try {
        const user = await User.findOne({ username });
        if (!user) return done(null, false, { message: "Invalid credentials" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch)
          return done(null, false, { message: "Invalid credentials" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ===== Routes =====

// Home/Dashboard
router.get("/", ensureAuthenticated, (req, res) => {
  res.render("index", { user: req.user });
});

// Auth Routes
router.get("/login", (req, res) => res.render("login"));
router.get("/register", (req, res) => res.render("register"));

router.post("/logout", ensureAuthenticated, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success_msg", "Logged out successfully");
    res.redirect("/login");
  });
});

// Registration (with express-validator)
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage("Valid email is required"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .custom(async (username) => {
        const exists = await User.exists({ username });
        if (exists) throw new Error("Username already in use");
      }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("password2")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match"),
    body("role").notEmpty().withMessage("Role is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("register", {
        errors: errors.array(),
        formData: req.body,
      });
    }

    try {
      const user = new User(req.body);
      await user.save();
      req.flash("success_msg", "Registration successful! Please login");
      res.redirect("/login");
    } catch (err) {
      console.error("Registration error:", err);
      req.flash("error_msg", "Registration failed");
      res.redirect("/register");
    }
  }
);

// Login
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    const redirectTo =
      req.user.role === "admin"
        ? "/admin"
        : req.user.role === "jeng"
        ? "/jeng"
        : "/";
    res.redirect(redirectTo);
  }
);

// Admin Routes
router.get("/admin", ensureAuthenticated, async (req, res) => {
  try {
    const [complaints, engineers] = await Promise.all([
      Complaint.find().sort({ createdAt: -1 }),
      User.find({ role: "jeng" }),
    ]);

    res.render("admin/admin", { complaints, engineers });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    req.flash("error_msg", "Failed to load admin dashboard");
    res.redirect("/");
  }
});

router.post(
  "/assign",
  ensureAuthenticated,
  [
    body("complaintID").notEmpty().withMessage("Complaint ID required"),
    body("engineerName").notEmpty().withMessage("Engineer required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("admin/admin", { errors: errors.array() });
    }

    try {
      await ComplaintMapping.create(req.body);
      req.flash("success_msg", "Complaint assigned successfully");
      res.redirect("/admin");
    } catch (err) {
      console.error("Assignment error:", err);
      req.flash("error_msg", "Failed to assign complaint");
      res.redirect("/admin");
    }
  }
);

// Engineer Routes
router.get("/jeng", ensureAuthenticated, async (req, res) => {
  try {
    const assignedComplaints = await ComplaintMapping.find({
      engineerName: req.user.username,
    }).populate("complaintID");
    res.render("junior/junior", { complaints: assignedComplaints });
  } catch (err) {
    console.error("Engineer dashboard error:", err);
    req.flash("error_msg", "Failed to load engineer dashboard");
    res.redirect("/");
  }
});

// Complaint Routes
router.get("/complaint", ensureAuthenticated, (req, res) => {
  res.render("complaint", { user: req.user });
});

router.post(
  "/registerComplaint",
  ensureAuthenticated,
  [
    body("contact").notEmpty().withMessage("Contact is required"),
    body("desc").notEmpty().withMessage("Description is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("complaint", { errors: errors.array() });
    }

    try {
      await Complaint.create({
        ...req.body,
        submittedBy: req.user.id,
      });
      req.flash("success_msg", "Complaint registered successfully");
      res.redirect("/");
    } catch (err) {
      console.error("Complaint submission error:", err);
      req.flash("error_msg", "Failed to register complaint");
      res.redirect("/complaint");
    }
  }
);

export default router;
