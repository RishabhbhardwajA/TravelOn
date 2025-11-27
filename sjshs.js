const express= require("express");
const app= express();
const mongoose = require("mongoose");
const Listing= require("./model/listing.js");
app.use(express.urlencoded({extended:true}));
const methodOverride = require("method-override");

app.use(methodOverride("_method"));
const ejsMate = require('ejs-mate');

app.engine('ejs', ejsMate);
const wrapAsync= require("./error/wrapAsync.js")
const ExpressError = require("./error/ExpressError.js");


const path= require("path");
const { render } = require("ejs");
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"/public")));

app.listen(8080,()=>{
    console.log("listening to port 8080");
});
app.get("/",(req,res)=>{
    res.send("wrok")
});

// app.get("/listing",async (req,res)=>{
//     const list = new Listing({
//         title:"Welcome to airbnb",
//         description:"this is your destination",
//         price:3455,
//         location:"new delhi",
//         country:"India"

//     }  );
//   await  list.save()
// .then(() => {
//     console.log("✅ Data saved!");
//     res.send("working");
// })
// .catch(err => console.log(err));
// })


// main

app.get("/listings",wrapAsync(async (req,res)=>{ 
   const list= await Listing.find({});
   res.render("listing/index.ejs",{list})
}));

// New create
app.get("/listings/new",(req,res)=>{
    res.render("listing/new.ejs");
});

app.post("/listings", wrapAsync(async (req, res,next) => {
  if(!req.body.listing){
    throw new ExpressError(400,"Bad reqest");
  }
  let data = { ...req.body.listing };
  if(!data.description){
    throw new ExpressError(405,"add description");
  }
  if (data.image) {
    data.image = { url: data.image };
  }

  let newListing = new Listing(data);
  await newListing.save();
  res.redirect("/listings");
}));

 
//edit
app.get("/listings/:id/edit",wrapAsync(async (req,res,next)=>{
    let {id}= req.params;
    const details= await Listing.findById(id);
    res.render("listing/edit.ejs",{details});
}));
 app.put("/listings/:id",wrapAsync( async (req, res,next) => {
  let { id } = req.params;
  if(!req.body.listing){
    throw new ExpressError(400,"Bad reqest");
  }
  let data = { ...req.body.listing };

  // Make sure image is always stored as { url: "…" }
  if (data.image) {
    data.image = { url: data.image };
  }

  await Listing.findByIdAndUpdate(id, data);
  res.redirect("/listings");
}));
 
// show

app.get("/listings/:id",wrapAsync(async (req,res,next)=>{
    let {id}= req.params;
   let listing=await Listing.findById(id);
   res.render("listing/show.ejs",{listing});
}));
//delete
app.delete("/listings/:id",wrapAsync(async (req,res,next)=>{
     let {id}= req.params;
 await Listing.findByIdAndDelete(id);
 res.redirect("/listings");
}));
//error handling
app.all(/.*/, (req, res, next) => {
  next(new ExpressError(405, "ohhh noo wrong request!"));
});


app.use((err,req,res,next)=>{
   let {status=500,message="something went wrong"}= err;
   res.render("listing/error.ejs",{err})
  //  res.status(status).send(message);
})



main().then((res)=>{
    console.log("connected");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
};
 
 