const employeeController = require("../controllers/employeeController.js");
const express = require("express");
const router = express.Router();
router.route("/").get(employeeController.getEmployees).post(employeeController.createEmployee);
module.exports = router;
