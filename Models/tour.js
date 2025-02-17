const mongoose = require("mongoose");

const tourSchema = mongoose.Schema({
    name : {
        type: String,
        required: [true, "A tour name is a must"],
        unique: [true, "Tour name is unique and immutable"],
        maxlength: [40, "Tour name length must be less than 40 characters!"],
        minlength: [10, "Tour name can't be less than 10 characters!"]
    },
    duration: {
        type: Number,
        required: [true, "A duration is a must"]
    },
    maxGroupSize : {
        type: Number,
        required: [true, "A max group size is a must"]
    },
    difficulty: {
        type: String,
        required: [true, "Difficulty is required"],
        trim: true,
        enum: {
            values: ["easy", "midium", "difficult"],
            message: "Difficulty is either : easy, medium, difficult"
        }
    },
    price: {
        type: Number,
        required: [true, "A tour price is a must"]
    },
    priceDiscount: {
        type: Number,
        validate: {
            // Only works on creating document.
            // Doesn't work on updating
            validator: function(val) {
                return val < this.price; // 100 < 200
            },
            message: "Discount ({VALUE}) should be less than the price value"    
        }
    },
    ratingAverage: {
        type: Number,
        default: 4.5,
        min: [1.0 , "Rating Average must be above 1.0"],
        max: [5.0 , "Rating Average must be below 5.0"]
    },
    ratingQuantity: {
        type: Number,
        default: 0
    },
    summary: {
        type: String,
        required: [true, "Summary is required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
    },
    imageCover: {
        type: String,
        required: [true, "A tour must have a cover image"]
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [String],
    secretTour: {
        type: Boolean,
        default: false
    }

}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
})
// VIRTUAL PROPERTIES
tourSchema.virtual("durationInWeeks").get(function () {
    return this.duration / 7;
})

// DOCUMENT MIDDLEWARE
tourSchema.pre("save", function(next) {
    console.log(this);
    next();
})

tourSchema.post("save", function(doc, next) {
    console.log("Document has been saved ==> ", doc);
    next();
})

// QUERY MIDDLEWARE
// tourSchema.pre("find", function(next) {
tourSchema.pre(/^find/, async function(next) {
    console.log("===PRE OF FIND===");
    if (this.getOptions && this.getOptions()._isInternal) {
        // Skip middleware for internal queries
        return next();
    }

    const updated = this.getUpdate?.();
    console.log("====UPDATED====",updated);
    if (updated && (updated["$set"].priceDiscount ||updated["$set"].price)) {
        console.log("pre of find");
        const docToUpdate = await this.model.findOne(this.getQuery(), {}, { _isInternal: true });
    
        const updatedPrice = updated["$set"].price || docToUpdate.price;
        const updatedPriceDiscound = updated["$set"].priceDiscount || docToUpdate.priceDiscount;
    
        console.log(`updatedPrice = ${updatedPrice}, updatedPriceDiscount = ${updatedPriceDiscound}`);
    
        if (updatedPriceDiscound > updatedPrice) {
            next(new Error("Price Discount must be lowwwwwer than the price itself"));
        }
        
        console.log("Query: ", this.getQuery());
        console.log("Document to Update: ", docToUpdate);
    }

    next();
})

tourSchema.post(/^find/, function(docs, next) {
    console.log("===POST OF FIND===");
    // console.log(docs)
    next();
})

// AGGREGATION MIDDLEWARE
tourSchema.pre("aggregate", function(next) {
    // this.pipeline().unshift({$match : {secretTour : {$ne : true}} });
    console.log(this.pipeline());
    next();
})

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;