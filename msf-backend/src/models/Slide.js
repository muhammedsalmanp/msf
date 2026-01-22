// import mongoose from 'mongoose';

// const slideSchema = new mongoose.Schema({
//   imageUrl: {
//     type: String,
//     required: true,
//   },
// }, { 
//   timestamps: true 
// });

// slideSchema.index({ createdAt: -1 }); 

// const Collection = new mongoose.model('Slide', slideSchema);
// export default Collection;


import mongoose from "mongoose";

const slideSchema = new mongoose.Schema(
  {
    imageKey: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

slideSchema.index({ createdAt: -1 });

const Slide = mongoose.model("Slide", slideSchema);
export default Slide;
