const router = require('express').Router();
const catCtrl = require('../controllers/categoryController');
const auth = require('../middleware/auth');

// Cualquier usuario (logueado o no) puede ver las categorías para navegar
router.get('/', catCtrl.getCategories);

// Solo el ADMINISTRADOR puede crear, editar o eliminar categorías
router.post('/', auth('admin'), catCtrl.createCategory);
router.put('/:id', auth('admin'), catCtrl.updateCategory);
router.delete('/:id', auth('admin'), catCtrl.deleteCategory);

module.exports = router;