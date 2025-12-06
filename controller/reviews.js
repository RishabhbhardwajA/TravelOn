const Review = require("../model/review.js");
const Listing = require("../model/listing.js");

module.exports.reviewPost=async(req,res)=>{
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
  newReview.author = req.user._id;

  listing.review.push(newReview._id);

  await newReview.save();
  await listing.save();
   
   req.flash("success","Review added successfully");
   res.redirect(`/listings/${listing._id}`);
};

module.exports.reviewDelete=async(req,res)=>{
  let {id,reviewId}= req.params;
  await Listing.findByIdAndUpdate(id,{$pull:{review:reviewId}});
  await Review.findByIdAndDelete(reviewId);
  req.flash("success","Review deleted successfully");
  res.redirect(`/listings/${id}`);
}