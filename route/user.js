const express = require("express");
const router = express.Router();
const wrapAsync = require("../error/wrapAsync.js");
const ExpressError = require("../error/ExpressError.js");


const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
const { signupPage, signup, loginPage, login, logout, changePasswordPage, changePassword } = require("../controller/users.js");

//signup
router.route("/signup")
    .get(signupPage)
    .post(wrapAsync(signup));

//login
router.route("/login")
    .get(loginPage)
    .post(saveRedirectUrl, login);

//logout
router.get("/logout", logout);

//change password
router.route("/change-password")
    .get(isLoggedIn, changePasswordPage)
    .post(isLoggedIn, wrapAsync(changePassword));

module.exports = router;