const Listing = require("../model/listing.js");
const User = require("../model/user.js");
const axios = require('axios');
const CATEGORIES = ["Trending", "Rooms", "Iconic", "Mountains", "Castles", "Pools", "Camping", "Farms", "Arctic", "Domes", "Boats"];

module.exports.listingsRoute = async (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;

  let query = {};

  // Search query
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
      { country: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
    ];
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Price filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  let list = await Listing.find(query).populate('review');

  // Calculate average rating for each listing
  list = list.map(listing => {
    const listingObj = listing.toObject();
    if (listing.review && listing.review.length > 0) {
      const totalRating = listing.review.reduce((sum, r) => sum + (r.rating || 0), 0);
      listingObj.avgRating = (totalRating / listing.review.length).toFixed(1);
    } else {
      listingObj.avgRating = 0;
    }
    return listingObj;
  });

  // Get user's wishlist for heart icons
  let userWishlist = [];
  if (req.user) {
    const user = await User.findById(req.user._id);
    userWishlist = user.wishlist.map(id => id.toString());
  }

  if (list.length === 0 && (q || category)) {
    req.flash("error", "No listings found!");
    return res.redirect("/listings");
  }

  res.render("listing/index.ejs", { list, category: CATEGORIES, userWishlist, fullWidth: true });
};

module.exports.newListing = (req, res) => {
  res.render("listing/new.ejs", { category: CATEGORIES });
};

module.exports.createListing = async (req, res, next) => {
  let response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${req.body.listing.location}&format=json&limit=1`);
  let lat, lon;
  if (response.data.length > 0) {
    lat = response.data[0].lat;
    lon = response.data[0].lon;
  }
  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  newListing.geometry = {
    type: 'Point',
    coordinates: [lon, lat]
  };

  await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.editRoute = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing does not exist!");
    return res.redirect("/listings");
  }
  let originalImage = listing.image.url;
  originalImage = originalImage.replace("/upload", "/upload/w_250")
  res.render("listing/edit.ejs", { listing, originalImage, category: CATEGORIES });
};

module.exports.updateRoute = async (req, res) => {
  const { id } = req.params;
  let listing = await Listing.findById(id);
  await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { runValidators: true, new: true });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Updated successfully");
  if (!listing) {
    req.flash("error", "Listing doesnt exist");
    return res.redirect("/listings");
  }
  res.redirect("/listings");
};

module.exports.showListings = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "review",
      populate: { path: "author" },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing doesnt exist");
    return res.redirect("/listings");
  }

  // Calculate average rating
  let avgRating = 0;
  if (listing.review && listing.review.length > 0) {
    const totalRating = listing.review.reduce((sum, r) => sum + (r.rating || 0), 0);
    avgRating = (totalRating / listing.review.length).toFixed(1);
  }

  // Check if in wishlist
  let isWishlisted = false;
  if (req.user) {
    const user = await User.findById(req.user._id);
    isWishlisted = user.wishlist.some(item => item.toString() === id);
  }

  res.render("listing/show.ejs", { listing, avgRating, isWishlisted, mapToken: process.env.MAP_TOKEN });
};

module.exports.deleteRoute = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Deleted successfully");
  res.redirect("/listings");
};

// Wishlist toggle
module.exports.toggleWishlist = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);

  // Ensure comparison logic handles ObjectIds correctly
  const listId = id.toString();
  const index = user.wishlist.findIndex(item => item.toString() === listId);
  let action;

  if (index === -1) {
    user.wishlist.push(id);
    action = "added";
  } else {
    user.wishlist.pull(id); // Use Mongoose pull for cleaner removal
    action = "removed";
  }

  await user.save();
  res.json({ success: true, action, wishlistCount: user.wishlist.length });
};

// Get wishlist page
module.exports.getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.render("listing/wishlist.ejs", { wishlist: user.wishlist, category: CATEGORIES });
};
