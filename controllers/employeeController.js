const Employee = require("../models/employee.js");
const catchAsync = require("../util/catchAsync");

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
  const { fname, lname, extensionsnumber, email, password } = req.body;
  const body = { fname, lname, extensionsnumber, email, password };
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
