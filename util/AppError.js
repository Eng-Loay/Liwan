class AppError extends Error{
    
    constructor(message , statusCode){
        super(message)

        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        //expected opertional error or non expected opertional error that needs attention
        this.isOperational= true
        //stack trace of the error
        Error.captureStackTrace(this , this.constructor)
    }

} 


module.exports = AppError