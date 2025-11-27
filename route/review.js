const express = require("express");
const router = express.Router({ mergeParams: true });
const ExpressError = require("../error/ExpressError.js");
const {reviewSchema} = require("../schema.js");
const Review = require("../model/review.js");
const wrapAsync = require("../error/wrapAsync.js");
const Listing = require("../model/listing.js");


//Joi validator

function validateReview(req, res, next) {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    let errNew= error.details.map((el)=>el.message).join(",")
    throw new ExpressError(400, errNew);
  }
  next();
}
// Review route
//post
router.post("/",validateReview,wrapAsync(async(req,res)=>{
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);

  listing.review.push(newReview._id);

  await newReview.save();
  await listing.save();
   
   req.flash("success","Review added successfully");
   res.redirect(`/listings/${listing._id}`);
}));

// delete
router.delete("/:reviewId",wrapAsync(async(req,res)=>{
  let {id,reviewId}= req.params;
  await Listing.findByIdAndUpdate(id,{$pull:{review:reviewId}});
  await Review.findByIdAndDelete(reviewId);
  req.flash("success","Review deleted successfully");
  res.redirect(`/listings/${id}`);
}));


module.exports= router;
