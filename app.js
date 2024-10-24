const mongoose = require("mongoose");
const morgan = require("morgan");
const express = require("express");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/AppError");
const ticketRouter = require("./routes/ticketRoute");
const employeeRouter = require("./routes/employeeRoute");
const departmentRouter = require("./routes/departmentRoute");
const globalErrorHandler = require("./controllers/errorController");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const app = express();
const fileStorege = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.body.userId;
    const dir = `./user_ticket/${userId}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "user_ticket/png" ||
    file.mimetype === "user_ticket/jpg" ||
    file.mimetype === "user_ticket/jpeg" ||
    file.mimetype === "user_ticket/webp" ||
    file.mimetype === "user_ticket/pdf" ||
    file.mimetype === "user_ticket/txt" ||
    file.mimetype === "user_ticket/docx" ||
    file.mimetype === "user_ticket/xlsx"
  ) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};
app.use(multer({ storage: fileStorege, fileFilter }).single("image"));
app.use("/user_ticket", express.static(path.join(__dirname, "user_ticket")));
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
