const Category = require('../models/Category');
const Content = require('../models/Content');

// Obtener todas las categorías incluyendo sus contenidos asociados
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ nombre: 1 }).lean();

    // Inyectamos el contenido correspondiente a cada categoría de forma paralela y eficiente
    const populatedCategories = await Promise.all(
      categories.map(async (cat) => {
        const contents = await Content.find({ categorias: cat._id })
          .select('titulo descripcion tipo imagen isPremium videoUrl')
          .sort({ createdAt: -1 });
        return {
          ...cat,
          contents // Mapeado dinámico para alimentar las filas del feed principal
        };
      })
    );

    res.json(populatedCategories);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener categorías y su catálogo", detalle: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ msg: "El nombre es requerido" });

    const existe = await Category.findOne({ nombre });
    if (existe) return res.status(400).json({ msg: "La categoría ya existe" });

    const nuevaCat = new Category({ nombre });
    await nuevaCat.save();
    res.status(201).json(nuevaCat);
  } catch (err) {
    res.status(500).json({ error: "Error al crear la categoría" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const actualizada = await Category.findByIdAndUpdate(
      req.params.id, 
      { nombre: req.body.nombre }, 
      { new: true, runValidators: true }
    );
    if (!actualizada) return res.status(404).json({ msg: "Categoría no encontrada" });
    res.json(actualizada);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar la categoría" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const delet = await Category.findByIdAndDelete(req.params.id);
    if (!delet) return res.status(404).json({ msg: "Categoría no encontrada" });
    res.json({ msg: "Categoría eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar la categoría" });
  }
};