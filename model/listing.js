const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review")

const ListingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,

  image: {
    url: {
      type: String,
      default:
        "https://static.vecteezy.com/system/resources/previews/012/400/885/large_2x/tropical-sunset-beach-and-sky-background-as-exotic-summer-landscape-with-beach-swing-or-hammock-and-white-sand-and-calm-sea-beach-banner-paradise-island-beach-vacation-or-summer-holiday-destination-photo.jpg",
    },
    filename: {
      type: String,
      default: "listingimage",
    },
  },

  price: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: (v) => Number.isFinite(v),
      message: "Price must be a valid number",
    },
  },

  location: {
    type: String,
    required: true,
  },

  country: {
    type: String,
    required: true,
  },

  review:[{
    type:Schema.Types.ObjectId,
    ref:"Review"},],

   owner:{
    type:Schema.Types.ObjectId,
    ref:"User"
   } ,

   geometry: {
        type: {
            type: String, 
            enum: ['Point'], 
            required: true
        },
    coordinates: {
            type: [Number],
            required: true
        }
    },
    category: {
        type: String,
        enum: ["Trending", "Rooms", "Iconic", "Mountains", "Castles", "Pools", "Camping", "Farms", "Arctic", "Domes", "Boats"]
    }

  
});

ListingSchema.post("findOneAndDelete",async(listing)=>{
  if(listing){
       await Review.deleteMany({_id:{$in:listing.review}});
      }
})

module.exports = mongoose.model("Listing", ListingSchema);
