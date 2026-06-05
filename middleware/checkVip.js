const User = require('../models/User');


module.exports = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ msg: "Usuario no autenticado" });
        }

        const userDB = await User.findById(userId).select('plan');
        
        if (!userDB) {
            return res.status(404).json({ msg: "Usuario no encontrado en base de datos" });
        }

        if (req.content?.isPremium && userDB.plan !== 'vip') {
            return res.status(403).json({ 
                msg: "Acceso denegado: Se requiere una suscripción VIP activa." 
            });
        }

        next();
    } catch (err) {
        console.error("Error en checkVip middleware:", err);
        res.status(500).json({ msg: "Error interno al validar suscripción" });
    }
};