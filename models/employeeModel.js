const crypto = require("crypto");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require("validator");
const bcrypt = require("bcryptjs");
const Department = require("../models/departmentModel");
const employeeSchema = new Schema(
  {
    fname: {
      type: String,
      required: [true, "Missing First Name"],
    },
    lname: {
      type: String,
      required: [true, "Missing Last Name"],
    },
    extensionsnumber: {
      type: Number,
      unique: true,
      required: [true, "Missing Extensionsnumber"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Missing Email"],
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Missing Password"],
      minLength: [5, "Password must be 5 char or above"],
      select: false,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      // default: null,
      // required: [true, "Missing Department"],
    },
    //virtual property
    // ticket: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Ticket",
    //   default: null,
    //   // required: [true, "Missing Ticket"],
    // },
    role: {
      //add admin to create account
      type: String,
      enum: {
        values: ["admin", "employee", "manager"],
        message: "Invalid Role",
      },
      default: "employee",
    },
    passwordChangedAt: Date, //to revoke the refresh token if the employee changed password
    passwordResetToken: String, //reset token for forget password
    passwordResetExpires: Date, //reset token expiry date

    //Employee Can Manges Department
    //Employee Can Create Tiket
    //Employee Can Works On Department
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Middleware to hash password before saving it to DB
employeeSchema.pre("save", async function (next) {
  //run if password was modified
  if (!this.isModified("password")) return next();
  console.log("hashing password...");
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

//Middleware to detect the password change time for auth
employeeSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//Check password
employeeSchema.methods.correctPassword = async function (
  candidatePassword,
  employeePassword
) {
  return await bcrypt.compare(candidatePassword, employeePassword);
};

employeeSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

employeeSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("Employee", employeeSchema);
