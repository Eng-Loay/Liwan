const catchAsync = require("../utils/catchAsync");
const Department = require("../models/departmentModel");
const AppError = require("../utils/AppError");

exports.getAllDepartments = catchAsync(async (req, res, next) => {
  const departments = await Department.find();
  if (!departments) return next(new AppError("No Departments Found!"));
  res.status(200).json({
    status: "success",
    data: {
      departments,
    },
  });
});
exports.getDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findById(req.params.id);
  if (!department)
    return next(new AppError("No Department Found with this ID!"));
  res.status(200).json({
    status: "success",
    data: {
      department,
    },
  });
});

exports.createDepartment = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  const department = await Department.create({ name });
  if (!department)
    return next(new AppError("Failed to create new Department!", 400));
  res.status(201).json({
    status: "success",
    data: {
      department,
    },
  });
});

exports.updateDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!department)
    return next(new AppError("No document found with that ID", 400));
  res.status(200).json({
    status: "success",
    data: {
      department,
    },
  });
});

exports.deleteDepartment = catchAsync(async (req, res, next) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department)
    return next(new AppError("No document found with that ID", 400));
  res.status(204).json({
    status: "success",
    data: null,
  });
});
