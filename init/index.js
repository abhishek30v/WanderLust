const mongoose = require("mongoose");
const initData = require("D:/Major Project/init/data.js");
const Listing = require("D:/MAJOR PROJECT/models/listing.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
.then((res) =>{
    console.log("connected to DB");
})
.catch((err) =>{
    console.log(err);
})

async function main(){
    await mongoose.connect(MONGO_URL);
}


//initializing the database by inserting data from data.js
const initDB = async() =>{
   await Listing.deleteMany({});  //delete existing data if any
   await Listing.insertMany(initData.data);
   console.log("data was initialized");
}

initDB();