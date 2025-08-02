const Listing = require("../models/listing");
const axios = require("axios");
const maptiler = require('@maptiler/client');
maptiler.config.apiKey = process.env.MAPTILER_API_KEY; // ✅ Set this ONCE globally
const { geocoding } = maptiler;


//smaptilersdk.config.apiKey = maptilerKey;


module.exports.index = async (req, res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};


module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
};

// module.exports.showListing = async(req, res)=>{
//     let {id} = req.params;
//     const listing = await Listing.findById(id)
//     .populate({
//         path: "reviews", 
//         populate: {
//             path: "author",
//         },
//     })
//     .populate("owner");
//     if(!listing){
//         req.flash("error", "Listing you requested for does not exist!");
//         res.redirect("/listings");
//     }
//     res.render("listings/show.ejs", { listing });
// };

module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    res.render("listings/show", { listing });
};

// module.exports.createListing = async(req, res, next) => {
//     let url = req.file.path;
//     let filename = req.file.filename;    

//     const newListing = new Listing(req.body.listing);
//     newListing.owner = req.user._id;
//     newListing.image = {url, filename};

//     await newListing.save();
//     req.flash("success", "New Listing Created");
//     res.redirect("/listings");
// };

// module.exports.createListing = async (req, res, next) => {
//     const { listing } = req.body;
//     const apiKey = process.env.MAPTILER_API_KEY;

//     try {
//         // 🗺️ 1. Geocode the location (address or city)
//         const geoResponse = await axios.get(
//             `https://api.maptiler.com/geocoding/${encodeURIComponent(listing.location)}.json?key=${apiKey}`
//         );

//         if (!geoResponse.data.features.length) {
//             req.flash("error", "Invalid location. Please enter a valid address.");
//             return res.redirect("/listings/new");
//         }

//         const coordinates = geoResponse.data.features[0].geometry.coordinates; // [lng, lat]

//         // 🖼️ 2. Handle uploaded image
//         const image = req.file
//             ? { url: req.file.path, filename: req.file.filename }
//             : { url: "", filename: "" };

//         // 🏡 3. Create new listing with geometry
//         const newListing = new Listing({
//             ...listing,
//             owner: req.user._id,
//             image,
//             geometry: {
//                 type: "Point",
//                 coordinates
//             }
//         });

//         await newListing.save();
//         req.flash("success", "New Listing Created");
//         res.redirect(`/listings/${newListing._id}`);

//     } catch (err) {
//         next(err);
//     }
// };


module.exports.createListing = async (req, res) => {
    try {
        // 1. Geocode the location
        const geoData = await geocoding.forward(req.body.listing.location, { limit: 1 });

        if (!geoData || !geoData.features || geoData.features.length === 0) {
            req.flash("error", "Invalid location. Please enter a valid location.");
            return res.redirect("/listings/new");
        }

        // 2. Create new listing from form data
        const newListing = new Listing(req.body.listing);

        // ❗ FIX: Set the logged-in user as owner
        newListing.owner = req.user._id;

        // 3. Store geometry
        newListing.geometry = {
            type: "Point",
            coordinates: geoData.features[0].geometry.coordinates,
        };

        // 4. Store image if uploaded
        if (req.file) {
            newListing.image = {
                url: req.file.path,
                filename: req.file.filename,
            };
        }

        // 5. Save to DB
        let savedListing = await newListing.save();
        console.log(savedListing);
        req.flash("success", "New listing created!");
        res.redirect(`/listings/${newListing._id}`);
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong while creating the listing.");
        res.redirect("/listings/new");
    }
};



module.exports.renderEditForm = async(req, res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", {listing, originalImageUrl});
};

// module.exports.updateListing = async(req, res)=>{
   
//     let {id} = req.params;
//     let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

//     if (typeof req.file !== "undefined"){
//         let url = req.file.path;
//         let filename = req.file.filename;
//         listing.image = { url, filename};
//         await listing.save();
//     }
    

//     req.flash("success", "Listing Updated!");

//     res.redirect(`/listings/${id}`);
// };

// module.exports.updateListing = async (req, res) => {
//     const { id } = req.params;
//     const updatedListingData = req.body.listing;

//     // Geocode the updated location
//     const geoRes = await axios.get(`https://api.maptiler.com/geocoding/${updatedListingData.location}.json`, {
//         params: {
//             key: process.env.MAPTILER_API_KEY,
//         },
//     });

//     const coordinates = geoRes.data.features[0]?.geometry?.coordinates || [0, 0];

//     updatedListingData.geometry = {
//         type: "Point",
//         coordinates: coordinates,
//     };

//     const listing = await Listing.findByIdAndUpdate(id, updatedListingData);

//     // Optional: handle updated image if needed
//     if (req.file) {
//         listing.image = {
//             url: req.file.path,
//             filename: req.file.filename,
//         };
//         await listing.save();
//     }

//     req.flash("success", "Listing updated!");
//     res.redirect(`/listings/${listing._id}`);
// };

module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found.");
            return res.redirect("/listings");
        }

        // Check if location has changed
        const newLocation = req.body.listing.location;
        if (newLocation && newLocation !== listing.location) {
            const geoData = await geocoding.forward(req.body.listing.location, { limit: 1 });


            if (geoData && geoData.features && geoData.features.length > 0) {
                listing.geometry = {
                    type: "Point",
                    coordinates: geoData.features[0].geometry.coordinates
                };
            } else {
                req.flash("error", "Invalid updated location.");
                return res.redirect(`/listings/${id}/edit`);
            }
        }

        // Update all other fields
        listing.title = req.body.listing.title;
        listing.description = req.body.listing.description;
        listing.price = req.body.listing.price;
        listing.country = req.body.listing.country;
        listing.location = newLocation;

        // Handle image update (optional)
        if (req.file) {
            listing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        await listing.save();
        req.flash("success", "Listing updated successfully!");
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to update listing.");
        res.redirect("/listings");
    }
};

module.exports.destroyListing = async(req, res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
};