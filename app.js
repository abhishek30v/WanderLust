const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync");
const expressError = require("./utils/expressError");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  mongoose.connect(MONGO_URL);
}

app.get("/", (req, res) => {
  res.send("hi , i am the root");
});

//Middleware function for joi schema validation of listings
const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((ele) => ele.message).join(",");
    throw new expressError(400, errMsg);
  } else {
    next();
  }
};

//Joi validation of reviews
const validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((ele) => ele.message).join(",");
    throw new expressError(400, errMsg);
  } else {
    next();
  }
};

//index route ->
app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  })
);

//New Route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

//show route ->
app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs", { listing });
  })
);

//Create Route
app.post(
  "/listings",
  validateListing,
  wrapAsync(async (req, res, next) => {
    /*if (!req.body.listing) {
      throw new expressError(400, "send a valid data for listing"); //400 is the error for the bad request of client side
    }*/

    //let {title,description,image,price,country,location} = req.body;
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
  })
);

//Edit Route
app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
  })
);

//Update Route
app.put(
  "/listings/:id",
  validateListing,
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
  })
);

//Delete Route
app.delete(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    //console.log(deletedListing);
    res.redirect("/listings");
  })
);

//Reviews
//Post Route
app.post(
  "/listings/:id/reviews",
  validateReview,
  wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    res.redirect(`/listings/${listing._id}`);
  })
);

//delete the review route
app.delete(
  "/listings/:id/reviews/:reviewId",
  wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
  })
);

// app.get("/testListing", async (req,res) => {
//     let sampleListing = new Listing({
//         title: "My Home Villah",
//         description: "By the Beach",
//         price : 1200,
//         location : "Calangute,Goa",
//         country : "India",
//     });

//     await sampleListing.save();
//     console.log("Sample was saved");
//     res.send("successful testing");
// });

app.all("*", (req, res, next) => {
  next(new expressError(404, "page not found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { err });
  //res.status(statusCode).send(message);
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
