const mongoose = require("mongoose");
const morgan = require("morgan");
const express = require("express");
const ticketRouter = require('./routes/ticketRoute')
const employeeRouter = require('./routes/employeeRoute')

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//body parser , reading data from body into req.body
app.use(express.json({ limit: "10kb" })); //limits the size of the body to 10kb

//serving static files
app.use(express.static(`${__dirname}/public`));

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log("meow meow bitch");
  next();
});

app.use('/api/v1/tickets' , ticketRouter)
app.use('/api/v1/employees' , employeeRouter)

module.exports = app;
