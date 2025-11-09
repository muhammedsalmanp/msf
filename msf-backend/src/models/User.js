import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  profileImage: {
    type: String
  },
  profileImageKey: {
    type: String
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  },
  roles: [{
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },
    scope: {
      type: String,
      enum: ['unit', 'main', 'haritha'],
      default: 'unit'
    },
  },],

  inChargeOfUnits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  }],
  isAdmin:{
    type:Boolean,
    default:false,
  },
  addedByAdmin: {
    type: Boolean,
    default: true
  },

}, {
  timestamps: true
});

userSchema.index({ "roles.scope": 1, "gender": 1 });

export default mongoose.model('User', userSchema);
