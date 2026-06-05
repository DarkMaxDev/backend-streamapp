const mongoose = require('mongoose');

const EpisodioSchema = new mongoose.Schema({
    numero: Number,
    titulo: String,
    url: String
}, { timestamps: true }); // <-- Esto genera automáticamente createdAt y updatedAt por episodio

const ContentSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: String,
    tipo: { type: String, enum: ['anime', 'pelicula', 'serie'], required: true },
    imagen: String,
    videoUrl: String, 
    linkTrailer: String,
    categorias: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    
    episodios: [EpisodioSchema], // Retrocompatibilidad con fechas individuales
    
    // Nueva estructura para series/animes con temporadas
    temporadas: [{
        numero: Number,
        episodios: [EpisodioSchema] // <-- Cada episodio aquí también tendrá su propia fecha
    }],
    
    isPremium: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['en_emision', 'finalizada'], 
        default: 'en_emision' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Content', ContentSchema);