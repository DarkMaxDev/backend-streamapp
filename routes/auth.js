const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const User = require('../models/User'); 

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/sessions', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('activeSessions subscriptionExpiration');
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: "Error al obtener sesiones" });
    }
});

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: "Error al obtener usuario" });
    }
});

module.exports = router;