const express = require("express");
const router = express.Router();
const wrapAsync = require("../error/wrapAsync.js");
const ExpressError = require("../error/ExpressError.js"); 


const { saveRedirectUrl } = require("../middleware.js");
const { signupPage, signup, loginPage, login, logout } = require("../controller/users.js");
//signup
router.route("/signup")
.get(signupPage)
.post(wrapAsync(signup));

//login

router.route("/login")
.get(loginPage)
.post( saveRedirectUrl,login);

//logout

router.get("/logout",logout);

module.exports= router;