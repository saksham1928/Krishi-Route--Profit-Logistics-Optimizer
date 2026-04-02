const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  state: { type: String, required: true, index: true },
  mandiName: { type: String, required: true, index: true },
  cropName: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  minPrice: { type: Number, required: true },
  modalPrice: { type: Number, required: true }
});

// This compound index ensures that we never get duplicate data for the same crop/mandi on the same day.
priceHistorySchema.index({ mandiName: 1, cropName: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);