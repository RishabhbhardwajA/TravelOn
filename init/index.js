const mongoose = require('mongoose');

main().then(()=>{
    console.log("success");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
};
const init= require("./data");
const Listing= require("../model/listing.js");

const initDB= async ()=>{
    await Listing.deleteMany({});
    init.data = init.data.map((obj) => ({
    ...obj,
    owner: "6930ad26d8f3f4c068986893", 
  }));
    await Listing.insertMany(init.data);
    console.log("data inserted");
};

initDB();