const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
    petId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    ageYear: { type: Number, default: 0 },
    ageMonth: { type: Number, default: 0 },
    sterilized: { type: String, enum: ['yes', 'no'], required: true },
    postStatus: { type: String, enum: ['open', 'close'], default: 'open' },
    color: { type: String },
    details: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pet', PetSchema);