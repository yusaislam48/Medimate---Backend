// backend/models/Patient.js

const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  wardNumber: { type: String, required: true },
  bedNumber: { type: String, required: true },
  rfidCardNumber: { type: String, required: true },
  // Add other fields as needed
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
