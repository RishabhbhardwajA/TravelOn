const Listing = require("../model/listing.js");
const axios = require('axios');
const CATEGORIES = ["Trending", "Rooms", "Iconic", "Mountains", "Castles", "Pools", "Camping", "Farms", "Arctic", "Domes", "Boats"];

module.exports.listingsRoute = async (req, res) => {
  const { q, category } = req.query;

  let list;
  if (q) {
    list = await Listing.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ]
    }
    );
  } else if (category) {
    list = await Listing.find({ category: category })
  } else {
    list = await Listing.find({});
  }

 if (list.length === 0 && (q || category)) {
  req.flash("error", "No listings found!");
  return res.redirect("/listings");
}
res.render("listing/index.ejs", { list, category: CATEGORIES });
 
};
 module.exports.newListing = (req, res) => {
    res.render("listing/new.ejs",{category: CATEGORIES});
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

    let savedListing = await newListing.save();
    console.log(savedListing);

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
    req.flash("success", "Updated  successfully");
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
    res.render("listing/show.ejs", { listing });
  };
  module.exports.deleteRoute = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Deleted successfully");
    res.redirect("/listings");
  };

