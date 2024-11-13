// backend/index.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import the `uuid` library to generate unique IDs
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5005;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for patients
let patients = [];

// In-memory storage for medicines
const medicines = [
  'Paracetamol',
  'Azithromycin',
  'Metformin',
  'Omeprazole',
  'Atorvastatin',
  'Amlodipine',
  'Losartan',
  'Cefixime',
  'Pantoprazole',
  'Cetirizine',
  'Ibuprofen',
  'Amoxicillin',
  'Ciprofloxacin',
  'Levofloxacin',
  'Ranitidine',
  'Fexofenadine',
  'Loratadine',
  'Diclofenac',
  'Gliclazide',
  'Clopidogrel',
  // Add more medicines as needed
];

// Initialize slots
let slots = [];
for (let i = 1; i <= 20; i++) {
  slots.push({
    slotNumber: i,
    medicine: '',
    stock: 0,
    status: '',
  });
}
// Assign unique IDs to patients
let patientIdCounter = 1;

// Routes

// Register a new patient
app.post('/api/patients', (req, res) => {
  const patient = req.body;
  patient.id = uuidv4();

  // Initialize distributionStatus for morning, day, and night to 'No'
  patient.distributionStatus = {
    morning: 'No',
    day: 'No',
    night: 'No',
  };

  patients.push(patient);
  res.status(201).json({ message: 'Patient registered successfully', patient });
});

// Get all patients
app.get('/api/patients', (req, res) => {
  res.json(patients);
});

// Get all medicines
app.get('/api/medicines', (req, res) => {
  res.json(medicines);
});

// Save prescriptions for a patient
app.post('/api/prescriptions', (req, res) => {
    const { patientId, prescriptions } = req.body;
  
    // Find the patient by ID
    const patient = patients.find((p) => p.id === patientId);
  
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
  
    // Initialize prescriptions array if not present
    if (!patient.prescriptions) {
      patient.prescriptions = [];
    }
  
    // Update prescriptions
    patient.prescriptions = prescriptions;
  
    res
      .status(201)
      .json({ message: 'Prescriptions saved successfully', prescriptions: patient.prescriptions });
});

// Get prescriptions for a specific patient
app.get('/api/patients/:id/prescriptions', (req, res) => {
    const patientId = req.params.id; // IDs are now strings
  
    // Find the patient by ID
    const patient = patients.find((p) => p.id === patientId);
  
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
  
    // Return the patient's prescriptions or an empty array if none exist
    res.json(patient.prescriptions || []);
  });

// Get a specific patient by ID
app.get('/api/patients/:id', (req, res) => {
    const patientId = req.params.id;
  
    // Find the patient by ID
    const patient = patients.find((p) => p.id === patientId);
  
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
  
    res.json(patient);
  });

// Function to get prescriptions for a specific time
const getPrescriptionsByTime = (time) => {
  let result = [];

  patients.forEach((patient) => {
    let medicinesForTime = [];

    if (patient.prescriptions && patient.prescriptions.length > 0) {
      patient.prescriptions.forEach((prescription) => {
        if (prescription[time] === 'Yes') {
          medicinesForTime.push(prescription.medicine);
        }
      });

      if (medicinesForTime.length > 0) {
        result.push({
          id: patient.id,
          name: patient.name,
          wardNumber: patient.wardNumber,
          bedNumber: patient.bedNumber,
          rfidCardNumber: patient.rfidCardNumber,
          medicines: medicinesForTime,
          medicineDistributionCompleted:
            patient.distributionStatus && patient.distributionStatus[time]
              ? patient.distributionStatus[time]
              : 'No',
        });
      }
    }
  });

  return result;
};

  // Get prescriptions for all patients for morning
  app.get('/api/prescriptions/morning', (req, res) => {
    const result = getPrescriptionsByTime('morning');
    res.json(result);
  });
  
  // Get prescriptions for all patients for day
  app.get('/api/prescriptions/day', (req, res) => {
    const result = getPrescriptionsByTime('day');
    res.json(result);
  });
  
  // Get prescriptions for all patients for night
  app.get('/api/prescriptions/night', (req, res) => {
    const result = getPrescriptionsByTime('night');
    res.json(result);
  });

// Update medicineDistributionCompleted for morning
app.post('/api/prescriptions/morning/:id', (req, res) => {
  updateDistributionStatus(req, res, 'morning');
});

// Update medicineDistributionCompleted for day
app.post('/api/prescriptions/day/:id', (req, res) => {
  updateDistributionStatus(req, res, 'day');
});

// Update medicineDistributionCompleted for night
app.post('/api/prescriptions/night/:id', (req, res) => {
  updateDistributionStatus(req, res, 'night');
});

// Helper function to update distribution status
const updateDistributionStatus = (req, res, time) => {
  const patientId = req.params.id;
  const patient = patients.find((p) => p.id === patientId);

  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  // Update the distribution status to 'Yes' for the specified time
  if (!patient.distributionStatus) {
    patient.distributionStatus = {};
  }
  patient.distributionStatus[time] = 'Yes';

  res.json({
    message: `Medicine distribution status updated to 'Yes' for ${time}`,
    patientId: patient.id,
    time: time,
    medicineDistributionCompleted: patient.distributionStatus[time],
  });
};


// Get all slots
app.get('/api/slots', (req, res) => {
    res.json(slots);
  });
// backend/index.js


// Update slots
app.post('/api/slots', (req, res) => {
    const updatedSlots = req.body.slots;
  
    // Validate the updated slots
    const usedMedicines = new Set();
  
    for (const slot of updatedSlots) {
      // If slot has a medicine assigned
      if (slot.medicine) {
        // Check if medicine is already assigned to another slot
        if (usedMedicines.has(slot.medicine)) {
          return res.status(400).json({
            message: `Medicine ${slot.medicine} is already assigned to another slot.`,
          });
        }
        usedMedicines.add(slot.medicine);
  
        // Validate stock
        if (slot.stock < 2 || slot.stock > 10) {
          return res.status(400).json({
            message: `Stock for slot ${slot.slotNumber} must be between 2 and 10.`,
          });
        }
      } else {
        // If no medicine is assigned, set stock to null
        slot.stock = null;
      }
    }
  
    // Update slots
    slots = updatedSlots.map((slot) => {
      // Update status based on stock
      let status = '';
      if (slot.medicine) {
        if (slot.stock <= 2) {
          status = 'Low Stock';
        } else {
          status = 'OK';
        }
        // Additional status conditions can be added
      } else {
        status = 'No Medicine Assigned';
      }
  
      return {
        slotNumber: slot.slotNumber,
        medicine: slot.medicine,
        stock: slot.stock,
        status: status,
      };
    });
  
    res.json({ message: 'Slots updated successfully', slots });
  });
  
  // ... existing code ...
  

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
