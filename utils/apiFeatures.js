class QueryHandler {
    constructor(model, queryObj) {
        this.model = model;
        this.queryObj = queryObj;
        this.query = null;
    }

    filter() {
        const excludedFields = ["page", "sort", "limit", "fields"];
        let queryObj = {...this.queryObj};
        console.log(queryObj);
        excludedFields.forEach(field => delete queryObj[field]);
    
        console.log(queryObj);
        // Convert Query Operators
        queryObj = JSON.stringify(queryObj);
        queryObj = queryObj.replace(/\b(gte|gt|lte|lt)\b/g, matched => `$${matched}`);
    
        queryObj = JSON.parse(queryObj);

        this.query = this.model.find(queryObj);
        return this;
    }

    sort() {
        if (this.queryObj.sort) {
            let sortingParams = this.queryObj.sort.split(",").join(" ");
            console.log(sortingParams);
    
            this.query = this.query.sort(sortingParams);
        } else {
            this.query = this.query.sort("-createdAt");
        }

        return this;
    }

    fieldsLimt() {
        if (this.queryObj.fields) {
            // {fields : "name,price,duration"}
            // {name:  1, price: 1, duration: 1}
            // let limitingFields = {};
            // this.queryObj.fields.split(",").forEach(field => limitingFields[field] = 1);
            let limitingFields = this.queryObj.fields.split(",").join(" ");
            this.query = this.query.select(limitingFields);
        }

        return this;
    }

    pagination() {

        const page = this.queryObj.page * 1 || 1;
        const limit = this.queryObj.limit * 1 || 1;
        const skip = (page-1) * limit;
        
        // in genral, return chunk of data even the user didn't ask.
        this.query = this.query.skip(skip).limit(limit);
    
        if (this.queryObj.page) {
            // const toursNumber = await this.model.countDocuments();
            // if (toursNumber >= skip) throw new Error("No tours to return")
        }
        
        return this;
    }
}

module.exports = QueryHandler;