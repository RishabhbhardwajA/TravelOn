const express = require("express");
const router = express.Router();
const wrapAsync = require("../error/wrapAsync.js");
const ExpressError = require("../error/ExpressError.js"); 
const User = require("../model/user.js")
const passport= require("passport");

//signup

router.get("/signup",(req,res)=>{
    res.render("listing/userpage/signup.ejs")
});

router.post("/signup",wrapAsync(async(req,res)=>{
   try{ let {username,email,password}= req.body;
    const NewUser = new User({username,email});
  const newUser= await  User.register(NewUser,password);
    console.log(newUser);
    req.login(newUser,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","Welcome to WanderLust");
    res.redirect("/listings");
    })
     
  }
    catch(e){
        req.flash("error",e.message);
        res.redirect("/signup")
    }
}));

//login

router.get("/login",(req,res)=>{
    res.render("listing/userpage/login.ejs")
});


router.post("/login",
    passport.authenticate("local",{
failureRedirect:"/login",
failureFlash: true,
}),
async(req,res)=>{
  req.flash("success","Welcome again to wanderlust!");
  res.redirect("/listings");
});


//logout

router.get("/logout",(req,res,next)=>{
    req.logout((err)=>{
        if(err){
          return   next(err);
        }
        req.flash("success","You are successfully logged out");
        res.redirect("/login");
    });
});
module.exports= router;