import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import { engine } from "express-handlebars";
import session from "express-session";
import passport from "passport";
import flash from "connect-flash";
import { connectDB } from "./db/connect.js";
import indexRoutes from "./routes/index.js";
import Handlebars from "handlebars";
// Config
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// Initialize Express
const app = express();

// ===== Database Connection =====
await connectDB();

// ===== Security Middleware =====
app.use(helmet()); // Security headers
app.use(cors({ origin: true, credentials: true })); // CORS
app.use(mongoSanitize()); // NoSQL injection protection
app.use(hpp()); // HTTP Parameter Pollution protection
app.use(cookieParser()); // Parse cookies

// ===== Rate Limiting =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});
app.use(limiter);

// ===== Performance =====
app.use(compression()); // Gzip compression

// ===== Body Parsing =====
app.use(express.json({ limit: "10kb" })); // JSON body parser
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // URL-encoded parser

// ===== Session Configuration =====
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: "lax",
  },
};

if (isProduction) {
  sessionConfig.cookie.secure = true; // Serve secure cookies in production
  // For production, you should use a session store like connect-mongo
  // sessionConfig.store = new MongoStore({ mongooseConnection: mongoose.connection });
}

app.use(session(sessionConfig));

// ===== Authentication =====
app.use(passport.initialize());
app.use(passport.session());

// ===== Flash Messages =====
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;
  next();
});

// ===== View Engine =====
const hbs = engine({
  handlebars: Handlebars,
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
});
app.engine("handlebars", hbs);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// ===== Static Files =====
app.use(express.static(path.join(__dirname, "public")));

// ===== Routes =====
app.use("/", indexRoutes);

// ===== Error Handling =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", { error: "Something went wrong!" });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
