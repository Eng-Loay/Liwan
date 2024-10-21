const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync.js");
const AppError = require("../utils/AppError.js");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const Employee = require("../models/employeeModel.js");
const { token } = require("morgan");
const signToken = (id, type) => {
  return jwt.sign(
    { id },
    type === "accessToken"
      ? process.env.JWT_SECRET_ACCESS
      : process.env.JWT_SECRET_REFRESH,
    {
      expiresIn:
        type === "accessToken"
          ? process.env.JWT_ACCESS_EXPIRY
          : process.env.JWT_REFRESH_EXPIRY,
    }
  );
};

exports.signup = catchAsync(async (req, res, next) => {
  const { fname, lname, extensionsnumber, email, password, role } = req.body;

  const employee = await Employee.create({
    fname,
    lname,
    extensionsnumber,
    email,
    password,
    role,
  });
  if (!employee)
    return next(
      new AppError("An error occurred while creating the user.", 500)
    );

  res.status(201).json({
    status: "success",
    data: {
      employee,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { emailOrExtension, password } = req.body;
  let employee;
  // Check if it's an email
  const isEmail = emailOrExtension.includes("@");
  // Check if it's an email
  if (isEmail) {
    employee = await Employee.findOne({ email: emailOrExtension }).select(
      "+password"
    );
  }
  // Check if it's an extension number (assuming it should be numeric)
  else if (!isNaN(emailOrExtension) && emailOrExtension.length === 4) {
    employee = await Employee.findOne({
      extensionsnumber: emailOrExtension,
    }).select("+password");
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
  if (
    !employee ||
    !(await employee.correctPassword(password, employee.password))
  ) {
    return next(
      new AppError("Incorrect email/extension number or password", 401)
    );
  }

  //Generaten access token
  const accessToken = signToken(employee._id, "accessToken");

  //Generaten refresh token
  const refreshToken = signToken(employee.id, "refreshToken");

  // Store refresh token in an HTTP-only cookie
  const cookieOptions = {
    httpOnly: true, // Prevent access by JavaScript
    secure: process.env.NODE_ENV === "production", // Use secure cookie in production
    sameSite: "Strict", // Prevent cross-site access,
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);

  // Respond with the token and employee ID
  res.status(200).json({
    status: "success",
    accessToken,
    refreshToken,
    data: {
      employee,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  // console.log(req.headers.authorization);
  // if (req.cookies.jwt) {
  //   token = req.cookies.jwt;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // console.log("the token", token);
  if (!token) {
    return next(new AppError("Access denied!! You are not logged in"), 401);
  }

  //2- Verification token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_ACCESS
  );
  // console.log(decoded.id);
  //3-If employee still exists
  const freshUser = await Employee.findById(decoded.id);
  // console.log('employee')
  if (!freshUser) {
    return next(new AppError("Employee no longer exists", 401));
  }

  // 4-Check if user changed password after token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError("PLease login in again", 401));
  }

  //Grant access to protected routes
  req.employee = freshUser;
  console.log(req.employee);
  next();
});
//restriction for create ,delete ,get employee
exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    if (!roles.includes(req.employee.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  });
};
exports.refreshToken = catchAsync(async (req, res, next) => {
  // console.log(req.cookies.refreshToken);
  //1-check if refresh token exists
  if (req.cookies.refreshToken) {
    const refreshToken = req.cookies.refreshToken;

    //2-verify the token
    const decoded = await promisify(jwt.verify)(
      refreshToken,
      process.env.JWT_SECRET_REFRESH
    );
    // console.log(decoded);
    if (!decoded) {
      return next(new AppError("invalid refresh token", 400));
    }

    const employee = await Employee.findById(decoded.id);
    // console.log(employee);
    //3-check if employee still exists
    if (!employee) {
      return next(new AppError("User no longer exists", 401));
    }
    // 4-Check if user changed password after token was issued
    if (employee.changedPasswordAfter(decoded.iat)) {
      return next(new AppError("PLease login in again", 401));
    }
    //Generaten access token
    const accessToken = signToken(employee._id, "accessToken");

    //Generaten refresh token
    const newRefreshToken = signToken(employee._id, "refreshToken");

    // Store refresh token in an HTTP-only cookie
    const cookieOptions = {
      httpOnly: true, // Prevent access by JavaScript
      secure: process.env.NODE_ENV === "production", // Use secure cookie in production
      sameSite: "Strict", // Prevent cross-site access,
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 1000
      ),
    };

    res.cookie("refreshToken", newRefreshToken, cookieOptions);
    res.status(200).json({
      status: "success",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } else {
    return next(new AppError("Access Denided 💥!"));
  }
});
