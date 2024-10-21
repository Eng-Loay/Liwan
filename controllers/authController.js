const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync.js");
const AppError = require("../utils/AppError.js");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const Employee = require("../models/employee.js");
const { token } = require("morgan");
const sendMail = require("../utils/email.js");
const nodemailer = require("nodemailer");
// const transporter = nodemailer.createTestAccount(
// sendgrid
// );

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

  const employee = await Employee.create({
    fname,
    lname,
    extensionsnumber,
    email,
    password: hashedPassword,
  });

  res.status(201).json({ message: "User created!", EmployeeId: employee._id });

  return next(new AppError("An error occurred while creating the user.", 500));
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
    //Generate access token
    const accessToken = signToken(employee._id, "accessToken");

    //Generate refresh token
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

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1- Get user based on posted email
  const emp = await Employee.findOne({ email: req.body.email });
  if (!emp) {
    return next(new AppError("No emp found with that email", 404));
  }
  console.log(emp);

  // 2- Generate the random reset token
  const resetToken = emp.createPasswordResetToken();
  await emp.save({ validateBeforeSave: false });

  // 3- Send it to user's email using nodemailer
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v3/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Please click this link to reset your password: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    // Nodemailer transport configuration

    await sendMail({
      email: emp.email,
      subject: "Your password reset token(valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    emp.passwordResetToken = undefined;
    emp.passwordResetExpires = undefined;
    await emp.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1- Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const emp = await Employee.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2- If token is not expired, set new password
  if (!emp) {
    return next(new AppError("Token is invalid or has expired", 401));
  }

  emp.password = req.body.password;

  emp.passwordResetToken = undefined;
  emp.passwordResetExpires = undefined;
  await emp.save();

  // 3- Generate new access token and refresh token
  const accessToken = signToken(emp._id, "accessToken");
  const refreshToken = signToken(emp._id, "refreshToken");

  // 4- Send new refresh token in HttpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 1000
    ),
  });

  // 5- Send new access token and user data
  res.status(200).json({
    status: "success",
    accessToken,
    refreshToken,
    data: {
      emp,
    },
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Check if user is authenticated
  if (!req.employee) {
    // Change from req.emp to req.employee
    return next(new AppError("User not found", 404)); // or handle as needed
  }

  console.log(req.employee); // This should log the employee object now
  const emp = await Employee.findById(req.employee.id).select("+password"); // Change from req.emp to req.employee

  // Check if employee exists
  if (!emp) {
    return next(new AppError("Employee not found", 404));
  }

  // 2- Check if the posted password is correct
  if (!(await emp.correctPassword(req.body.currentpassword, emp.password))) {
    return next(new AppError("Incorrect password", 401));
  }

  // 3- If so, update the password
  emp.password = req.body.password;
  await emp.save();

  // 4- Clear the refresh token
  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    expires: new Date(Date.now()),
  });

  res.status(200).json({
    status: "success",
    message: "Password updated successfully, and you have been logged out.",
  });
});
