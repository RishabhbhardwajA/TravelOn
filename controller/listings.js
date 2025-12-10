const Listing = require("../model/listing.js");
const User = require("../model/user.js");
const axios = require('axios');
const CATEGORIES = ["Trending", "Rooms", "Iconic", "Mountains", "Castles", "Pools", "Camping", "Farms", "Arctic", "Domes", "Boats"];
const ITEMS_PER_PAGE = 12;

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

  // Get first page of listings with pagination
  let list = await Listing.find(query)
    .populate('review')
    .limit(ITEMS_PER_PAGE)
    .sort({ _id: -1 });

  // Get total count for pagination
  const totalListings = await Listing.countDocuments(query);
  const hasMore = totalListings > ITEMS_PER_PAGE;

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

  res.render("listing/index.ejs", {
    list,
    category: CATEGORIES,
    userWishlist,
    fullWidth: true,
    hasMore,
    totalListings
  });
};

// API endpoint for infinite scroll
module.exports.listingsAPI = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * ITEMS_PER_PAGE;

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

    // Get listings with pagination
    let listings = await Listing.find(query)
      .populate('review')
      .skip(skip)
      .limit(ITEMS_PER_PAGE)
      .sort({ _id: -1 });

    // Get total count
    const totalListings = await Listing.countDocuments(query);
    const hasMore = skip + listings.length < totalListings;

    // Calculate average rating
    listings = listings.map(listing => {
      const listingObj = listing.toObject();
      if (listing.review && listing.review.length > 0) {
        const totalRating = listing.review.reduce((sum, r) => sum + (r.rating || 0), 0);
        listingObj.avgRating = (totalRating / listing.review.length).toFixed(1);
      } else {
        listingObj.avgRating = 0;
      }
      return listingObj;
    });

    // Get user's wishlist
    let userWishlist = [];
    if (req.user) {
      const user = await User.findById(req.user._id);
      userWishlist = user.wishlist.map(id => id.toString());
    }

    res.json({
      success: true,
      listings,
      hasMore,
      page: parseInt(page),
      totalListings,
      userWishlist
    });
  } catch (err) {
    console.error("Listings API error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports.newListing = (req, res) => {
  res.render("listing/new.ejs", { category: CATEGORIES });
};

module.exports.createListing = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      req.flash("error", "Please upload an image");
      return res.redirect("/listings/new");
    }

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (err) {
    console.error("Create listing error:", err);
    next(err);
  }
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

  res.render("listing/show.ejs", { listing, avgRating, isWishlisted });
};

module.exports.deleteRoute = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Deleted successfully");
  res.redirect("/listings");
};

// Wishlist toggle
module.exports.toggleWishlist = async (req, res) => {
  try {
    // 1) User login check
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Login required" });
    }

    const { id } = req.params;

    // 2) User find
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 3) Agar wishlist undefined hai to array bana do
    if (!Array.isArray(user.wishlist)) {
      user.wishlist = [];
    }

    const listId = id.toString();
    const index = user.wishlist.findIndex(item => item.toString() === listId);

    let action;
    if (index === -1) {
      // add
      user.wishlist.push(id);
      action = "added";
    } else {
      // remove
      user.wishlist.pull(id);
      action = "removed";
    }

    await user.save();

    return res.json({
      success: true,
      action,
      wishlistCount: user.wishlist.length,
    });
  } catch (err) {
    console.error("toggleWishlist error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get wishlist page
module.exports.getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.render("listing/wishlist.ejs", { wishlist: user.wishlist, category: CATEGORIES });
};
