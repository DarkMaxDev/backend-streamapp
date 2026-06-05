const jwt = require('jsonwebtoken');

// Exportamos una función que devuelve el middleware
module.exports = function(roleRequired = null) {
    return function(req, res, next) {
        // 1. Obtener token de x-auth-token O de Authorization Bearer
        const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ msg: 'Sin token, acceso denegado' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Aseguramos que req.user siempre tenga la estructura esperada
            req.user = decoded.user || decoded; 
            
            // 2. Validación de rol (si se requiere)
            if (roleRequired && req.user.role !== roleRequired) {
                return res.status(403).json({ msg: 'Acceso denegado: Se requiere rol de ' + roleRequired });
            }
            
            next(); // ✅ Aquí es donde el flujo continúa
        } catch (err) {
            console.error("Error en auth middleware:", err.message);
            res.status(401).json({ msg: 'Token inválido' });
        }
    };
};