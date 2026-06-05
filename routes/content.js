const router = require('express').Router();
const contentCtrl = require('../controllers/contentController');
const auth = require('../middleware/auth');
const checkSub = require('../middleware/checkSub');
const checkVip = require('../middleware/checkVip');
const Content = require('../models/Content');

router.get('/', auth(), contentCtrl.getAll);

router.get('/:id', auth(), async (req, res, next) => {
    try {
        const content = await Content.findById(req.params.id).populate('categorias');
        if (!content) return res.status(404).json({ msg: "Contenido no encontrado" });

        if (req.user && req.user.role === 'admin') {
            return res.json({ content });
        }

        req.content = content;
        next(); 
    } catch (err) {
        res.status(500).json({ error: "Error al cargar contenido" });
    }
}, checkSub, checkVip, (req, res) => {
    res.json({
        content: req.content,
        showAds: req.user.plan !== 'vip'
    });
});

router.get('/all/list', auth('admin'), async (req, res) => {
    const catalogo = await Content.find().populate('categorias');
    res.json(catalogo);
});

router.post('/', auth('admin'), contentCtrl.create);
router.put('/:id', auth('admin'), contentCtrl.update);
router.delete('/:id', auth('admin'), contentCtrl.delete);
router.post('/release-screen', auth(), contentCtrl.releaseScreen);
router.post('/reset-screens', auth('admin'), contentCtrl.resetUserScreens);

module.exports = router;