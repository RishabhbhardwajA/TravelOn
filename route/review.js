const express = require("express");
const router = express.Router({ mergeParams: true });
const ExpressError = require("../error/ExpressError.js");

const wrapAsync = require("../error/wrapAsync.js");

const {validateReview,isLoggedIn,isOwner, isReviewAuthor}= require("../middleware.js");
const { reviewPost, reviewDelete } = require("../controller/reviews.js");



//Joi validator


// Review route
//post
router.post("/",validateReview,isLoggedIn,wrapAsync(reviewPost));

// delete
router.delete("/:reviewId",isLoggedIn,isReviewAuthor,wrapAsync(reviewDelete));


module.exports= router;
