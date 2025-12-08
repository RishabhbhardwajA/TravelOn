const express = require("express");
const router = express.Router();
const wrapAsync = require("../error/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing, normalizeListing } = require("../middleware.js");

// Controller Imports
const {
    listingsRoute,
    newListing,
    createListing,
    editRoute,
    updateRoute,
    showListings,
    deleteRoute,
    toggleWishlist,
    getWishlist
} = require("../controller/listings.js");

const multer = require('multer');
const { storage } = require("../cloudinary.js");
const upload = multer({ storage });


// ---------------------------------------------
// 1. INDEX & CREATE ROUTE (Sabse Upar)
// ---------------------------------------------
router.route("/")
    .get(wrapAsync(listingsRoute))
    .post(
        isLoggedIn,
        normalizeListing,
        upload.single('listing[image]'),
        validateListing,
        wrapAsync(createListing)
    );

// Wishlist routes
router.get("/wishlist", isLoggedIn, wrapAsync(getWishlist));
router.post("/:id/wishlist", isLoggedIn, wrapAsync(toggleWishlist));

// ---------------------------------------------
// 2. NEW ROUTE (CRITICAL: Ye /:id se PEHLE aana chahiye)
// ---------------------------------------------
router.get("/new", isLoggedIn, newListing);

// ---------------------------------------------
// 3. ID BASED ROUTES (Sabse Neeche)
// (Show, Update, Delete, Edit)
// ---------------------------------------------

router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(editRoute));

router.route("/:id")
    .get(wrapAsync(showListings)) // Show route
    .put(
        isLoggedIn,
        isOwner,
        normalizeListing,
        upload.single('listing[image]'),
        validateListing,
        wrapAsync(updateRoute)
    )
    .delete(isLoggedIn, isOwner, wrapAsync(deleteRoute));

module.exports = router;