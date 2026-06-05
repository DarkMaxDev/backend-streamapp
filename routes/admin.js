const router = require('express').Router();
const User = require('../models/User');
const Analytics = require('../models/Analytics');
const auth = require('../middleware/auth');

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', auth('admin'), async (req, res) => {
    try {
        const stats = await Analytics.find().sort({ date: -1 }).limit(15);
        res.json(stats);
    } catch (err) {
        console.error("Error en dashboard-stats:", err);
        res.status(500).json({ error: "Error al obtener estadísticas" });
    }
});

// GET /api/admin/users
router.get('/users', auth('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error("Error al obtener usuarios:", err);
        res.status(500).json({ error: "Error al cargar la lista de usuarios" });
    }
});

// PUT /api/admin/user/:id/manage
router.put('/user/:id/manage', auth('admin'), async (req, res) => {
    const { plan, hasAds, subscriptionEnd, role } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { plan, hasAds, subscriptionEnd, role },
            { new: true }
        ).select('-password');
        res.json({ msg: "Usuario actualizado", user });
    } catch (err) {
        console.error("Error al actualizar usuario:", err);
        res.status(500).send("Error al actualizar");
    }
});

// POST /api/admin/ad-revenue
// CORREGIDO: Se pasa 'auth' sin ejecutar con paréntesis vacíos para evitar que rompa el flujo
router.post('/ad-revenue', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        await Analytics.updateOne(
            { date: today }, 
            { $inc: { adRevenue: 0.05, visits: 1 } }, 
            { upsert: true }
        );
        res.json({ ok: true });
    } catch (err) {
        console.error("Error en ad-revenue:", err);
        res.status(500).json({ error: "Error al procesar ingresos de publicidad" });
    }
});

// DELETE /api/admin/user/:id
router.delete('/user/:id', auth('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });
        res.json({ msg: "Usuario eliminado con éxito" });
    } catch (err) {
        console.error("Error al eliminar usuario:", err);
        res.status(500).send("Error al eliminar");
    }
});

module.exports = router;