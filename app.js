const mongoose = require("mongoose");
const morgan = require("morgan");
const express = require("express");
const cookieParser = require("cookie-parser");

const ticketRouter = require("./routes/ticketRoute");
const employeeRouter = require("./routes/employeeRoute");
const departmentRouter = require("./routes/departmentRoute");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use((req, res, next) => {
  // console.log(req.cookies); //to get the cookie coming with the request
  next();
});
//body parser , reading data from body into req.body
app.use(express.json({ limit: "10kb" })); //limits the size of the body to 10kb

//serving static files
app.use(express.static(`${__dirname}/public`));

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use("/api/v1/tickets", ticketRouter);
app.use("/api/v1/employees", employeeRouter);
app.use("/api/v1/departments", departmentRouter);
app.use(globalErrorHandler);
module.exports = app;
