const mongoose = require('mongoose');

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Forzamos a usar DNS de Google

const express = require('express');

const connectDB = async () => {
  try {
    // Usamos la URI de tu .env
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' MongoDB Conectado exitosamente');
  } catch (err) {
    console.error(' Error de conexión:', err.message);
    process.exit(1); // Detiene la app si falla la conexión
  }
};

// ESTA LÍNEA ES LA QUE FALTA O ESTÁ MAL:
module.exports = connectDB;