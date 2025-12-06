const Review= require("./model/review");
const Listing= require("./model/listing");
const ExpressError = require("./error/ExpressError.js");
const { listingSchema } = require("./schema.js");
const {reviewSchema} = require("./schema.js");

module.exports.isLoggedIn= (req,res,next)=> {
   
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
    req.flash("error","You must logged be in");
   return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async(req,res,next)=>{
     const { id } = req.params;
      let listing= await Listing.findById(id);
      if(!listing.owner.equals(res.locals.currUser._id)){
        req.flash("error","Yor are not allowed to edit");
       return  res.redirect(`/listings/${id}`);
      }
      next();
};

module.exports.validateListing= (req, res, next)=> {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    let errNew = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errNew);
  }
  next();
};

module.exports.validateReview=(req, res, next) =>{
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    let errNew= error.details.map((el)=>el.message).join(",")
    throw new ExpressError(400, errNew);
  }
  next();
};

module.exports.isReviewAuthor = async(req,res,next)=>{
     const {id, reviewId } = req.params;
      let review= await Review.findById(reviewId);
      if(!review.author.equals(res.locals.currUser._id)){
        req.flash("error","Yor are not allowed to delete");
       return  res.redirect(`/listings/${id}`);
      }
      next();
};



module.exports.normalizeListing = (req, res, next) => {
  
    if (!req.body.listing) {
        return next(); 
    }
    let data = { ...req.body.listing };
    if (data.image && typeof data.image === 'string') {
        data.image = { url: data.image, filename: 'listingimage' };
    }
    if (data.price) {
        const priceValue = Number(data.price);
        if (!Number.isFinite(priceValue)) {
            throw new ExpressError(400, "Price must be a valid number");
        }
        data.price = priceValue;
    }
    req.body.listing = data; 
    next();
};