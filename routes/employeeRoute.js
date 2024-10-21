const employeeController = require("../controllers/employeeController.js");
const authController = require("../controllers/authController.js");
const Employee = require("../models/employee.js");
const { body } = require("express-validator");
const express = require("express");
const router = express.Router();

router.post("/singUp", authController.signup);
router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.get("/refreshToken", authController.refreshToken);

//access only by admin
//restrictTo('admin')
router.use(authController.protect, authController.restrictTo("admin"));
router
  .route("/")
  .get(authController.protect, employeeController.getEmployees)
  .post(employeeController.createEmployee);
router
  .route("/:id")
  .get(employeeController.getEmployee)
  .patch(employeeController.updateEmployee)
  .delete(employeeController.deleteEmployee);

module.exports = router;
