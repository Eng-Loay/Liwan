// models/Department.js
const mongoose = require("mongoose");
const employee = require("./employee.js");
const Schema = mongoose.Schema;

const departmentSchema = new Schema({
  name: {
    type: String,
    required: [true, "Missing Name"]
    },
  manager: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: [true, "Missing Manager"]
    }, // Foreign Key
});

const Department = mongoose.model("Department", departmentSchema);

module.exports = Department;
