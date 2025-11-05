import mongoose from 'mongoose';

const unitUsersSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: true
    },
    password: {
        type: String
    },
    profileImage: { type: String },
    profileImageKey: { type: String },

    unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },
    roles:[{
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
        },
        scope: {
            type: String,
            enum: ['msf','haritha'],
            default: 'msf'
        },
    }],
},
    {
        timestamps: true
    });

export default mongoose.model('Unit-users', unitUsersSchema);
