const User = require('../models/User');
const Analytics = require('../models/Analytics');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, email, password, adminKey } = req.body;
    
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ msg: "El correo ya está registrado" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const isAdmin = adminKey === process.env.ADMIN_KEY;
        const userRole = isAdmin ? 'admin' : 'user';

        const user = new User({
            username, 
            email, 
            password: hashedPassword,
            role: userRole,
            plan: 'free', 
            subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        
        await user.save();
        await Analytics.updateOne({ date: new Date().toISOString().split('T')[0] }, { $inc: { newUsers: 1 } }, { upsert: true });

        res.json({ msg: `Usuario registrado como ${userRole}` });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
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