const express = require("express");
const router = express.Router();
const Listing = require("../model/listing.js");
const wrapAsync = require("../error/wrapAsync.js");
const ExpressError = require("../error/ExpressError.js");
const { listingSchema } = require("../schema.js");
const {isLoggedIn}= require("../middleware.js");

// JOI VALIDATOR
function validateListing(req, res, next) {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    let errNew = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errNew);
  }
  next();
}


// NORMALIZER (you forgot this in router)
function normalizeListingData(body) {
  const data = { ...body.listing };

  if (data.image) {
    data.image = { url: data.image };
  }

  if (data.price !== undefined) {
    const priceValue = Number(data.price);
    if (!Number.isFinite(priceValue)) {
      throw new ExpressError(400, "Price must be a valid number");
    }
    data.price = priceValue;
  }

  return data;
}




// ALL LISTINGS
router.get("/", wrapAsync(async (req, res) => {
  const list = await Listing.find({});
  res.render("listing/index.ejs", { list });
}));


// NEW LISTING FORM
router.get("/new",isLoggedIn ,(req, res) => {

  res.render("listing/new.ejs");
});


// CREATE LISTING
router.post("/",isLoggedIn, validateListing, wrapAsync(async (req, res,next ) => {
  const data = normalizeListingData(req.body);
  const newListing = new Listing(data);
  await newListing.save();
  req.flash("success","application added successfully");
  res.redirect("/listings");
}));


// EDIT FORM
router.get("/:id/edit", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const details = await Listing.findById(id);
  if (!details) throw new ExpressError(404, "Listing not found");
  req.flash("success","Edited successfully");
  res.render("listing/edit.ejs", { details });
}));


// UPDATE LISTING
router.put("/:id",isLoggedIn, validateListing, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const data = normalizeListingData(req.body);
  await Listing.findByIdAndUpdate(id, data, { runValidators: true,new:true });
  req.flash("success","Updated  successfully");
  if (!listing) {
  req.flash("error","Listing doesnt exist");
  return  res.redirect("/listings");
}
  res.redirect("/listings");
}));


// SHOW LISTING
router.get("/:id", wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("review");
if (!listing) {
  req.flash("error","Listing doesnt exist");
  return  res.redirect("/listings");
}
  res.render("listing/show.ejs", { listing });
}));


// DELETE LISTING
router.delete("/:id",isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success","Deleted successfully");
  res.redirect("/listings");
}));


module.exports = router;
