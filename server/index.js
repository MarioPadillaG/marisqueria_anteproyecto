const fastify = require('fastify')({ logger: true });
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./marisqueria.db');

fastify.register(require('@fastify/static'), { root: path.join(__dirname, '../client') });
fastify.register(require('@fastify/cors'), { origin: '*' });

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS mesas (id INTEGER PRIMARY KEY, capacidad INTEGER, estado TEXT, pax INTEGER, consumo REAL)");
});

fastify.get('/', (req, reply) => reply.sendFile('index.html'));

fastify.get('/api/mesas', async () => {
  return new Promise((resolve) => db.all("SELECT * FROM mesas", [], (err, rows) => resolve(rows)));
});

// Ruta para actualizar estado, pax y consumo
fastify.patch('/api/mesas/:id', async (req) => {
  const { id } = req.params;
  const { estado, pax, consumo } = req.body;
  return new Promise((resolve) => {
    db.run("UPDATE mesas SET estado = ?, pax = ?, consumo = ? WHERE id = ?", [estado, pax || 0, consumo || 0, id], () => resolve({ success: true }));
  });
});

fastify.post('/api/mesas', async (req) => {
  const { capacidad } = req.body;
  return new Promise((resolve) => {
    db.run("INSERT INTO mesas (capacidad, estado, pax, consumo) VALUES (?, 'disponible', 0, 0)", [capacidad], function() {
      resolve({ id: this.lastID });
    });
  });
});

fastify.listen({ port: 3000 });