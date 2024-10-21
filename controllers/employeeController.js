const Employee = require("../models/employeeModel.js");
const catchAsync = require("../utils/catchAsync");

exports.getEmployees = catchAsync(async (req, res, next) => {
  const employees = await Employee.find();
  res.status(200).json({
    status: "success",
    results: employees.length,
    data: {
      employees,
    },
  });
});

exports.createEmployee = catchAsync(async (req, res, next) => {
  const { fname, lname, extensionsnumber, email, password, department } =
    req.body;
  const body = { fname, lname, extensionsnumber, email, password, department };
  if (req.body.role) {
    body.role = req.body.role;
  }

  const employee = await Employee.create(body);
  res.status(201).json({
    status: "success",
    data: {
      employee,
    },
  });
});

exports.getEmployee = catchAsync(async (req, res, next) => {
  const employee = await Employee.findOne({ _id: req.params.id });
  if (!employee) {
    return next(new Error("No employee found with that ID"));
  }
  res.status(200).json({
    status: "success",
    data: {
      employee,
    },
  });
});
exports.updateEmployee = catchAsync(async (req, res, next) => {
  const employee = await Employee.findOneAndUpdate(
    { _id: req.params.id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!employee) {
    return next(new Error("No employee found with that ID"));
  }
  res.status(200).json({
    status: "success",
    data: {
      employee,
    },
  });
});
exports.deleteEmployee = catchAsync(async (req, res, next) => {
  const employee = await Employee.findOneAndDelete({ _id: req.params.id });
  if (!employee) {
    return next(new Error("No employee found with that ID"));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});
