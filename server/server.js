// C:\Users\mario\marisqueria_anteproyecto\server\index.js
const fastify = require('fastify')({ logger: true });
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./marisqueria.db');

// 1. Configurar soporte para archivos estáticos (Frontend)
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../client'),
});

// 2. Habilitar CORS
fastify.register(require('@fastify/cors'), { origin: '*' });

// 3. Inicializar tabla de mesas
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS mesas (id INTEGER PRIMARY KEY, capacidad INTEGER, estado TEXT)");
});

// 4. Ruta raíz: Sirve el index.html automáticamente
fastify.get('/', (req, reply) => {
  return reply.sendFile('index.html');
});

// 5. API: Obtener mesas
fastify.get('/api/mesas', async (request, reply) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM mesas", [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
});

// 6. API: Agregar mesa
fastify.post('/api/mesas', async (request, reply) => {
  const { capacidad, estado } = request.body;
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO mesas (capacidad, estado) VALUES (?, ?)", [capacidad, estado], function(err) {
      if (err) reject(err);
      resolve({ id: this.lastID });
    });
  });
});

// 7. API: Actualizar estado de mesa
fastify.patch('/api/mesas/:id', async (request, reply) => {
  const { id } = request.params;
  const { estado } = request.body;
  return new Promise((resolve, reject) => {
    db.run("UPDATE mesas SET estado = ? WHERE id = ?", [estado, id], function(err) {
      if (err) reject(err);
      resolve({ updated: this.changes });
    });
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Servidor corriendo en http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();