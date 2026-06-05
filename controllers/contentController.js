const Content = require('../models/Content');
const User = require('../models/User'); // Importante para las funciones de pantallas

exports.getAll = async (req, res) => {
    try {
        const content = await Content.find(); // <-- Sin populate para optimizar listas de admin
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener el contenido", detalle: err.message });
    }
};

exports.getContentById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscamos el contenido y traemos las categorías de forma limpia y segura
        const infoObra = await Content.findById(id).populate('categorias', '_id nombre');

        if (!infoObra) {
            return res.status(404).json({ message: "No se encontró la obra especificada" });
        }

        // Retornamos la información estructurada limpia
        return res.json(infoObra);

    } catch (error) {
        console.error("❌ Error en el controlador al buscar por ID:", error);
        
        // Validación de error dinámica nativa de JavaScript
        let mensaje = "Error interno en el servidor al procesar la serie";
        if (error && error.message) {
            mensaje = error.message;
        }

        return res.status(500).json({ 
            message: "Error interno en el servidor al procesar la serie", 
            error: mensaje
        });
    }
};

exports.create = async (req, res) => {
    try {
        const newContent = new Content(req.body);
        await newContent.save();
        res.status(201).json(newContent);
    } catch (err) {
        res.status(500).json({ error: "Error al crear el contenido", detalle: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const updated = await Content.findByIdAndUpdate(
            req.params.id, 
            { $set: req.body }, // Usar $set es una mejor práctica para actualizaciones
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ msg: "Contenido no encontrado" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar el contenido", detalle: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const deleted = await Content.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ msg: "Contenido no encontrado" });
        res.json({ msg: 'Eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar el contenido", detalle: err.message });
    }
};

exports.checkScreenLimit = async (req, res, next) => {
    try {
        // Validación de protección por si el middleware de auth no inyectó el usuario correctamente
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: "No autorizado, falta token de usuario" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

        if (user.activeScreens >= user.maxScreens) {
            return res.status(403).json({ msg: "Límite de pantallas simultáneas alcanzado" });
        }

        user.activeScreens += 1;
        await user.save();
        
        if (typeof next === 'function') next();
    } catch (err) {
        res.status(500).json({ error: "Error al verificar el límite de pantallas", detalle: err.message });
    }
};

exports.releaseScreen = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: "No autorizado" });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id, 
            { $inc: { activeScreens: -1 } }, 
            { returnDocument: 'after' } 
        );
        
        if (user && user.activeScreens < 0) {
            user.activeScreens = 0;
            await user.save();
        }

        res.json({ msg: "Pantalla liberada con éxito", activeScreens: user ? user.activeScreens : 0 });
    } catch (err) {
        res.status(500).json({ error: "Error al liberar la pantalla", detalle: err.message });
    }
};

exports.resetUserScreens = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findByIdAndUpdate(userId, { activeScreens: 0 }, { new: true });
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
        
        res.json({ msg: "Contadores de pantalla reiniciados", activeScreens: user.activeScreens });
    } catch (err) {
        res.status(500).json({ error: "Error al reiniciar pantallas", detalle: err.message });
    }
};