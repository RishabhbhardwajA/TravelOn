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
    await Listing.insertMany(init.data);
    console.log("data inserted");
};

initDB();