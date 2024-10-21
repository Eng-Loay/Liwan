const Tour = require("../Models/tourModel")

class APIFeatures{
    constructor(query , queryString){
        this.query = query
        this.queryString = queryString
    }

    filter(){
        const queryObj = {...this.queryString}
        //array of fields that should be excluded from the filter such as query functions
        const excludedFields = ['page','sort','limit','fields']
        //This makes sure that only the criteria is used in the filter by deleting the unwanted fields
        excludedFields.forEach(el => delete queryObj[el])

        let queryStr = JSON.stringify(queryObj)
        //using regular expressions to replace the words "gte", "gt", "lte", and "lt" with their corresponding MongoDB operators
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g , match => `$${match}`)
        //parsing the querystr back to javascript after modification
        this.query = this.query.find(JSON.parse(queryStr))
        return this
    }
    sort(){
        //check if we have a sorting method
        if(this.queryString.sort){
            console.log(this.queryString.sort)
            //extracting the sorting value and then process 
            //the sort string though split into an array split by commas between
            //sorting values and then join the array of string separted by space
            const sortBy = this.queryString.sort.split(',').join(' ')
            //applying the sorting criteria
            this.query = this.query.sort(sortBy)
        }else{
            //if no sorting string found then by default sort by created at
            this.query = this.query.sort('-CreatedAt')
        }
        return this
    }
    limitField(){
        //check field query param
        if(this.queryString.fields){
            //intia
            const fields = this.queryString.fields.split(',').join(' ')
            //field param provided then select only the specified field then return data accordingly
            this.query = this.query.select(fields)
        }else{
            this.query = this.query.select('-__v')//the - means not to include
        }
        
        return this
    }
    paginate(){
        //extract page val from querystring , *1 = to turn string to number , || 1 = set default to 1
        const page = this.queryString.page * 1 || 1
        //if there's a limit value then extract from querystring to include only the docs the user wants to see
        const limit = this.queryString.limit * 1 || 100

        //Multiplying by limit determines how many documents to skip based on 
        //the requested page number and the desired number of documents per page
        const skip = (page - 1) * limit

        //then we use the skip value and the limit into the mongoose methods skip and limit
        this.query = this.query.skip(skip).limit(limit)

        return this
    }


}


module.exports = APIFeatures