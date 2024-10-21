const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const departmentSchema = new Schema({
  name: {
    type: String,
    required: [true, "Missing Department Name"],
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: "Employee",
  }, // Foreign Key
});

const Department = mongoose.model("Department", departmentSchema);

module.exports = Department;
