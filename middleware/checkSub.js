const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

        // Verificar si la suscripción ya expiró
        if (new Date() > user.subscriptionEnd) {
            return res.status(403).json({ msg: "Tu suscripción ha expirado. Por favor renueva tu plan." });
        }

        // Pasar info al request para que el controlador sepa si poner anuncios
        req.userPlan = user.plan;
        req.hasAds = user.hasAds; 
        
        next();
    } catch (err) {
        res.status(500).json({ msg: "Error verificando suscripción" });
    }
};