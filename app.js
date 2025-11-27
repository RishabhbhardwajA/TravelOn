const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./error/ExpressError.js");
const listings = require("./route/listing.js");
const review = require("./route/review.js");
const session = require("express-session");
const flash= require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./model/user.js");
const Userroute = require("./route/user.js");





// SETUP 
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const sessionOptions= {
  secret:"rishabhkahai",
  resave: false,
  saveUninitialized:true,
};




app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.success= req.flash("success");
  res.locals.error= req.flash("error");
  res.locals.currUser= req.user;
  next();
});



app.get("/", (req, res) => {
  res.redirect("/listings");
});
app.use("/listings",listings);
app.use("/listings/:id/review",review);
app.use("/",Userroute);


// Fix favicon request
app.get("/favicon.ico", (req, res) => res.status(204).end());



// Unknown route
app.all(/.*/, (req, res, next) => {
  console.log("Invalid hit:", req.method, req.url);
  next(new ExpressError(405, "Invalid Route"));
});


// Error handler
app.use((err, req, res, next) => {
  const { status = 500 } = err;
  res.status(status).render("listing/error.ejs", { err });
});


// DATABASE
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}
main()
  .then(() => console.log("connected"))
  .catch((err) => console.log(err));


// Server
app.listen(8080, () => {
  console.log("listening on port 8080");
});
