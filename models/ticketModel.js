const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Ticket must has Title !"],
    },
    description: {
      type: String,
      required: [true, "Ticket must has Description !"],
    },
    type: {
      type: mongoose.Schema.ObjectId, //Department ID
      ref: "Department",
    },
    employee: {
      type: mongoose.Schema.ObjectId, //employee ID
      ref: "Employee",
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId, //manager ID
      ref: "Employee",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    status: {
      type: String,
      enum: {
        values: ["rejected", "accepted", "pending"],
      },
      default: "pending",
    },
    updatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;
