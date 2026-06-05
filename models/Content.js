// models/Content.js
const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: String,
    tipo: { type: String, enum: ['anime', 'pelicula', 'serie'], required: true },
    imagen: String,
    videoUrl: String, // Usado principalmente para películas
    linkTrailer: String,
    categorias: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    
    // Mantenemos episodios por retrocompatibilidad
    episodios: [{
        numero: Number,
        titulo: String,
        url: String
    }],
    
    // Nueva estructura para series/animes con temporadas
    temporadas: [{
        numero: Number,
        episodios: [{
            numero: Number,
            titulo: String,
            url: String
        }]
    }],
    
    isPremium: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['en_emision', 'finalizada'], 
        default: 'en_emision' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Content', ContentSchema);