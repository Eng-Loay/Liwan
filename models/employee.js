const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const employeeSchema = new Schema({
  fname: {
    type: String,
    required: [true, "Missing First Name"],
  },
  lname: {
    type: String,
    required: [true, "Missing Last Name"],
  },
  extensionsnumber: {
    type: String,
    unique: true,
    required: [true, "Missing Extensionsnumber"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Missing Email"],
  },
  password: {
    type: String,
    required: [true, "Missing Password"],
  },
  department: {
    type: Schema.Types.ObjectId,
    ref: "Department",
    default:null
    // required: [true, "Missing Department"],
  },
  ticket: {
    type: Schema.Types.ObjectId,
    ref: "Ticket",
    default:null
    // required: [true, "Missing Ticket"],
  },
  //Employee Can Manges Department
  //Employee Can Create Tiket
  //Employee Can Works On Department
});
module.exports = mongoose.model("Employee", employeeSchema);
