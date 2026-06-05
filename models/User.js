const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' }, 
    plan: { type: String, enum: ['free', 'basic', 'vip'], default: 'free' },
    hasAds: { type: Boolean, default: true },
    subscriptionEnd: { type: Date },
    
    // --- CONTROL DE DISPOSITIVOS (LOGIN) ---
    maxSessions: { type: Number, default: 5 }, // Cuántos equipos pueden tener el Login activo
    activeSessions: [{
        ip: String,
        deviceName: String,
        lastActive: { type: Date, default: Date.now }
    }],

    // --- CONTROL DE REPRODUCCIÓN (STREAMING) ---
    maxScreens: { type: Number, default: 2 }, // Cuántos pueden darle "Play" a la vez
    activeScreens: { type: Number, default: 0 }, // Contador dinámico de reproducciones activas
    
    favoritos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);