import mongoose from 'mongoose';

const RegistrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    required: [true, 'Please provide a role']
  },
  image: {
    type: String,
    default: ''
  },
  isScanned: {
    type: Boolean,
    default: false
  },
  scannedAt: {
    type: Date,
    default: null
  },
  currentProfession: {
    type: String,
    default: ''
  },
  investmentField: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
});

// Prevent recompiling the model
export default mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);