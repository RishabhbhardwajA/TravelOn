if (process.env.NODE_ENV != "production") {
  require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./error/ExpressError.js");
const listingsRoute = require("./route/listing.js");
const reviewRoute = require("./route/review.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./model/user.js");
const Userroute = require("./route/user.js");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");



// SETUP 
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // For JSON API requests like wishlist
app.use(methodOverride("_method"));

// Security middleware
app.use(mongoSanitize()); // Prevents NoSQL injection
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://picsum.photos", "https://tile.openstreetmap.org", "https://cdn-icons-png.flaticon.com"],
      connectSrc: ["'self'", "https://nominatim.openstreetmap.org", "https://api.cloudinary.com", "https://*.cloudinary.com"],
      frameSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

if (process.env.NODE_ENV === "production") {
  app.set('trust proxy', 1);
};

// DATABASE
const mongoDbUrl = process.env.ATLASDB_URL;
async function main() {
  await mongoose.connect(mongoDbUrl);
}
main()
  .then(() => console.log("connected"))
  .catch((err) => console.log(err));



const store = MongoStore.create({
  mongoUrl: mongoDbUrl,
  touchAfter: 24 * 3600,
  collectionName: 'sessions'
});

store.on("error", (err) => {
  console.error("Session Store Error:", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};




app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "User not found" });
      }

      const result = await user.authenticate(password);

      if (result.user) {
        return done(null, result.user);
      } else {
        return done(null, false, { message: "Incorrect password" });
      }
    } catch (err) {
      return done(err);
    }
  }
));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.locals.baseUrl = "https://travel-listing-pyt8.onrender.com";
  next();
});

app.get("/listings/search", (req, res) => {
  res.redirect("/listings");
});

app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/", Userroute);
app.use("/listings", listingsRoute);
app.use("/listings/:id/review", reviewRoute);


// Fix favicon request
app.get("/favicon.ico", (req, res) => res.status(204).end());




// Unknown route
app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});


// Error handler
app.use((err, req, res, next) => {
  const { status = 500 } = err;
  res.status(status).render("listing/error.ejs", { err });
});



// Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});