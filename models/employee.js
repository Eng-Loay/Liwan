const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require('validator')
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
      //validate : [validator.isEmail , 'Invalid email!!!!']
    },
    password: {
      type: String,
      required: [true, "Missing Password"],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
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
        values: ["admin", "employee"],
        message: "Invalid Role",
      },
      default: "employee"
    },

    //Employee Can Manges Department
    //Employee Can Create Tiket
    //Employee Can Works On Department
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
module.exports = mongoose.model("Employee", employeeSchema);
