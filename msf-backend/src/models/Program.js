import mongoose from 'mongoose';

const programSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },

  conductedBy: {
    type: String,
    required: true,
    enum: ['State', 'District', 'Constituency', 'Panchayat']
  }

}, { timestamps: true });

export default mongoose.model('Program', programSchema);