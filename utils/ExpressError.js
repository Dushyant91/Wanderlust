
class ExpressError extends Error{
    constructor(statusCode, message){
        super();
        this.statusCode=statusCode;
        this.method=message;
    }
}

module.exports = ExpressError;