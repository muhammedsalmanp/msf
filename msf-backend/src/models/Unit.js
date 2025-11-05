import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  adminDefaultUsername: {
    type: String,
  },
  adminDefaultPassword: {
    type: String,
  },
  msfCommittee: {
    president: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit-users' },
    secretary: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit-users' },
    treasurer: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit-users' },
    vicePresidents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit-users' }],
    jointSecretaries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit-users' }],
  },
  harithaCommittee: {
    president: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit-users' },
    secretary: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit-users' },
    treasurer: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit-users' },
    vicePresidents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit-users' }],
    jointSecretaries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit-users' }],
  },
  inCharges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  programs: [
    {
      name: { type: String, required: true },
      date: { type: Date, required: true },
      description: { type: String, required: true },
      image: [String],
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
  ],
  totalScore: {
    type: Number,
    default: 0,
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F'],
    default: 'F',
  },
  classification: {
    type: String,
    enum: ['Excellent', 'Good', 'Average'],
    default: 'Average',
  },
  rank: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });
unitSchema.index({ rank: 1 });

unitSchema.index({ totalScore: -1 });
export default mongoose.model('Unit', unitSchema);
