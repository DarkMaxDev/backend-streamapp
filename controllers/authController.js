const User = require('../models/User');
const Analytics = require('../models/Analytics');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    // 1. Log para saber si la petición realmente llegó a Render y qué datos trae
    console.log("=== Petición de registro recibida en producción ===");
    console.log("Body recibido:", req.body);

    const { username, email, password, adminKey } = req.body;
    
    try {
        // Verificar si las dependencias clave o el modelo existen antes de operar
        if (!User) {
            console.error("Error: El modelo 'User' no está definido o importado.");
            return res.status(500).json({ error: "Error interno: Modelo User no disponible." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`Registro fallido: El correo ${email} ya existe.`);
            return res.status(400).json({ msg: "El correo ya está registrado" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Validación segura por si process.env.ADMIN_KEY no se ha propagado correctamente
        const serverAdminKey = process.env.ADMIN_KEY || null;
        const isAdmin = serverAdminKey && adminKey === serverAdminKey;
        const userRole = isAdmin ? 'admin' : 'user';

        const user = new User({
            username, 
            email, 
            password: hashedPassword,
            role: userRole,
            plan: 'free', 
            subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        
        console.log("Intentando guardar el usuario en la base de datos...");
        await user.save();
        console.log("Usuario guardado exitosamente.");

        // Bloque aislado para Analytics por si este modelo es el que falla
        try {
            if (typeof Analytics !== 'undefined' && Analytics.updateOne) {
                console.log("Actualizando métricas en Analytics...");
                await Analytics.updateOne(
                    { date: new Date().toISOString().split('T')[0] }, 
                    { $inc: { newUsers: 1 } }, 
                    { upsert: true }
                );
                console.log("Métricas actualizadas.");
            } else {
                console.warn("Advertencia: El modelo Analytics no está disponible o importado.");
            }
        } catch (analyticsErr) {
            // Si falla analytics, lo logeamos pero NO rompemos la respuesta del usuario ya creado
            console.error("Error no crítico en el modelo de Analytics:", analyticsErr.message);
        }

        return res.json({ msg: `Usuario registrado como ${userRole}` });

    } catch (err) { 
        // 2. Este log imprimirá el error real con lujo de detalle en la pestaña 'Logs' de Render
        console.error("=== ERROR CRÍTICO EN REGISTER ===");
        console.error("Mensaje del error:", err.message);
        console.error("Stack Trace:", err.stack);

        return res.status(500).json({ error: err.message }); 
    }
};

exports.login = async (req, res) => {
    const { email, password, deviceName } = req.body;
    const userIP = req.ip || "127.0.0.1";
    
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ msg: "Credenciales inválidas" });
        }

        // Control de Sesiones
        const sessionExists = user.activeSessions.find(s => s.ip === userIP);
        if (!sessionExists) {
            if (user.activeSessions.length >= (user.maxSessions || 2)) {
                return res.status(401).json({ msg: "Límite de dispositivos alcanzado" });
            }
            user.activeSessions.push({ ip: userIP, deviceName: deviceName || 'Desconocido' });
        }
        
        user.lastLogin = Date.now();
        await user.save();

        const payload = {
            user: {
                id: user._id,
                role: user.role,
                plan: user.plan 
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                username: user.username, 
                role: user.role, 
                plan: user.plan 
            } 
        });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ msg: "Error en login" }); 
    }
};