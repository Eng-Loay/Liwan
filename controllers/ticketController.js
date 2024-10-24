const Ticket = require("../models/ticketModel");
const catchAsync = require("../utils/catchAsync");

exports.getAll = catchAsync(async (req, res) => {
  const tickets = await Ticket.find();

  res.status(200).json({
    status: "Success",
    results: tickets.length,
    data: {
      tickets,
    },
  });
});
exports.uploadTiket = catchAsync(async (req, res, next) => {
  // Create a new ticket with the data from the request body
  if (!req.file) {
    return next(new AppError("No file uploaded or invalid file format", 400));
  }
  const title = req.body.title;
  const description = req.body.description;
  const file = req.file.filename;
  const newTicket = await Ticket.create({
    title,
    description,
    file,
  });
  // Send a success response with status code 201
  res.status(201).json({
    status: "success",
    data: {
      ticket: newTicket,
    },
  });
});
