const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  date: { type: String, unique: true }, // Formato: "2024-05-20"
  visits: { type: Number, default: 0 },
  adRevenue: { type: Number, default: 0 }, // Ganancia estimada
  newUsers: { type: Number, default: 0 }
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);