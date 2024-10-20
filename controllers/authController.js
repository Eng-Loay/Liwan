const { promisify } = require('util')
const jwt = require("jsonwebtoken");
const catchAsync = require("../util/catchAsync");
const AppError = require("../util/AppError.js");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const Employee = require("../models/employee.js");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_ACCESS, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError("Validation failed.", 422));
  }

  const { fname, lname, extensionsnumber, email, password } = req.body;
  let hashedPassword = await bcrypt.hash(password, 12);

  // Check if the extensionsnumber already exists
  const existingEmployee = await Employee.findOne({ extensionsnumber });
  if (existingEmployee) {
    return next(
      new AppError(
        "The extensions number already exists. Please choose a different one.",
        400
      )
    );
  }

  try {
    const employee = await Employee.create({
      fname,
      lname,
      extensionsnumber,
      email,
      password: hashedPassword,
    });

    res
      .status(201)
      .json({ message: "User created!", EmployeeId: employee._id });
  } catch (error) {
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return next(
        new AppError(
          "The extensions number already exists. Please choose a different one.",
          400
        )
      );
    }
    return next(
      new AppError("An error occurred while creating the user.", 500)
    );
  }
});

exports.login = catchAsync(async (req, res, next) => {
  console.log("login");
  const { emailOrExtension, password } = req.body;

  let employee;

  // Check if it's an email
  if (body("emailOrExtension").isEmail() === true) {
    console.log("email");
    employee = await Employee.findOne({ email: emailOrExtension });
    console.log(employee);
  }
  // Check if it's an extension number
  else if (body("emailOrExtension").isLength({ min: 4 }).isNumeric()) {
    console.log("number");
    employee = await Employee.findOne({ extensionsnumber: emailOrExtension });
    console.log(employee);
  }
  // If neither email nor extension number, return an error
  else {
    return next(
      new AppError(
        "Invalid input. Please provide a valid email or extension number.",
        400
      )
    );
  }

  // If no employee is found
  if (!employee) {
    return next(
      new AppError(
        "A user with this email or extension number could not be found.",
        404
      )
    );
  }

  // Compare password (you may want to use bcrypt here if passwords are hashed)
  const isMatch = await bcrypt.compare(password, employee.password);
  if (!isMatch) {
    return next(new AppError("Wrong password!", 401));
  }
  // Generate Access token
  const Accesstoken = jwt.sign(
    { id: employee._id },
    process.env.JWT_SECRET_ACCESS,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY,
    }
  );

  //Generaten refresh token
  const refreshToken = jwt.sign(
    { id: employee._id },
    process.env.JWT_SECRET_REFRESH,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY,
    }
  );

  // Store refresh token in an HTTP-only cookie
  const cookieOptions = {
    httpOnly: true, // Prevent access by JavaScript
    secure: process.env.NODE_ENV === "production", // Use secure cookie in production
    sameSite: "Strict", // Prevent cross-site access,
    //maxAge : process.env.JWT_REFRESH_EXPIRY
    
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);

  // Respond with the token and employee ID
  res.status(200).json({
    status: "success",
    data: {
      Accesstoken,
      refreshToken,
      employee: employee._id,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1- Get token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Access denied!! You are not logged in"), 401);
  }

  //2- Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)

  //3-If user still exists
  const freshUser = await Employee.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError("User no longer exists", 401));
  }

  //4-Check if user changed password after token was issued
  // if(freshUser.ChangedPW(decoded.iat)){
  //     return next(new AppError('PLease login in again' , 401))
  // }

  //Grant access to protected routes
  req.Employee = freshUser;
  console.log(req.user);
  next();
});

exports.refreshToken = catchAsync(async (req, res, next) => {});
