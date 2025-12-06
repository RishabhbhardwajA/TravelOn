if(process.env.NODE_ENV!="production"){
require('dotenv').config();
}

console.log(process.env.SECRET);
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
const MongoStore = require('connect-mongo').default;
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
console.log("MERI VALUE YAHAN HAI:", MongoStore);

// DATABASE
const mongoDbUrl= process.env.ATLASDB_URL;
async function main() {
  await mongoose.connect(mongoDbUrl);
}
main()
  .then(() => console.log("connected"))
  .catch((err) => console.log(err));



const  store= MongoStore.create({
  mongoUrl:mongoDbUrl, 
  crypto:{
    secret: process.env.SECRET ,
  },
  touchAfter:24*3600,
});

store.on("error",(err)=>{
  console.log("ERROR IN MONGO_SESSION STORE",err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET ,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, 
    secure: true, 
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
        console.log("User not found in DB");
        return done(null, false, { message: "User not found" });
      }
      
      console.log("User found, checking password...");
      const result = await user.authenticate(password);
      
      if (result.user) {
        console.log("Password matched!");
        return done(null, result.user);
      } else {
        console.log("Password wrong!");
        return done(null, false, { message: "Incorrect password" });
      }
    } catch (err) {
      console.log("Error in strategy:", err);
      return done(err);
    }
  }
));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.get("/listings/search",(req,res)=>{
    console.log("working");
}); 

app.get("/", (req, res) => {
  res.redirect("/listings");
}); 

app.use("/",Userroute);
app.use("/listings",listingsRoute);
app.use("/listings/:id/review",reviewRoute);


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



// Server
app.listen(8080, () => {
  console.log("listening on port 8080");
});
