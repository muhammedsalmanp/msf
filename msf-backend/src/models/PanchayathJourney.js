
import mongoose from "mongoose";

const journeySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  images: [{
    type: String
  }],

});
journeySchema.index({ date: -1 });
export default mongoose.model("PanchayathJourney", journeySchema);
