const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const departmentSchema = new Schema({
  name: {
    type: String,
    required: [true, "Missing Department Name"],
  },
  employeesNumber: {
    type: Number,
    default: 0,
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
    required: [true, "Missing Manager"],
  }, // Foreign Key
});

const Department = mongoose.model("Department", departmentSchema);

module.exports = Department;
