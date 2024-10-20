const employeeController = require("../controllers/employeeController.js");
const AuthController = require("../controllers/authController.js");
const Employee = require("../models/employee.js");
const { body } = require("express-validator");
const express = require("express");
const router = express.Router();
//access only by admin
//restrictTo('admin')
router
  .route("/")
  .get(employeeController.getEmployees)
  .post(
    [
      body("email")
        .isEmail()
        .withMessage("Please enter a valid email.")
        .custom((value, { req }) => {
          return Employee.findOne({ email: value }).then((userDoc) => {
            if (userDoc) {
              return Promise.reject("E-mail address already exists!");
            }
          });
        })
        .normalizeEmail(),
      body("password").trim().isLength({ min: 5 }),
      body("fname").trim().not().isEmpty(),
      body("lname").trim().not().isEmpty(),
      body("extensionsnumber").trim().not().isEmpty(),
    ],
    employeeController.createEmployee
  );
router.post("/login", AuthController.login);
router.post("/signup", AuthController.signup);
module.exports = router;
