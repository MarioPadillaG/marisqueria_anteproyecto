const fastify = require('fastify')({ logger: true });
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./marisqueria.db');

fastify.register(require('@fastify/static'), { root: path.join(__dirname, '../client') });
fastify.register(require('@fastify/cors'), { origin: '*' });

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS mesas (id INTEGER PRIMARY KEY, capacidad INTEGER, estado TEXT, pax INTEGER, consumo REAL, cliente_nombre TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS ventas (id INTEGER PRIMARY KEY, cliente_nombre TEXT, monto REAL, fecha DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

// Ruta para sugerir mesa (Algoritmo de optimización de capacidad)
fastify.get('/api/sugerir/:pax', async (req) => {
  const pax = parseInt(req.params.pax);
  return new Promise((r) => {
    // Filtra mesas disponibles con capacidad >= pax y ordena por capacidad ascendente (la más pequeña que quepa)
    db.get("SELECT * FROM mesas WHERE estado = 'disponible' AND capacidad >= ? ORDER BY capacidad ASC LIMIT 1", 
    [pax], (err, row) => r(row || { error: "No hay mesas disponibles para ese grupo" }));
  });
});

fastify.get('/api/mesas', async () => new Promise(r => db.all("SELECT * FROM mesas", [], (err, rows) => r(rows))));
fastify.get('/api/ventas', async () => new Promise(r => db.all("SELECT * FROM ventas ORDER BY fecha DESC", [], (err, rows) => r(rows))));
fastify.get('/api/ranking', async () => new Promise(r => db.all("SELECT cliente_nombre, SUM(monto) as total FROM ventas GROUP BY cliente_nombre ORDER BY total DESC LIMIT 5", [], (err, rows) => r(rows))));

fastify.post('/api/mesas', async (req) => new Promise(r => db.run("INSERT INTO mesas (capacidad, estado, pax, consumo, cliente_nombre) VALUES (?, 'disponible', 0, 0, '')", [req.body.capacidad], function() { r({ id: this.lastID }) })));
fastify.post('/api/ventas', async (req) => new Promise(r => db.run("INSERT INTO ventas (cliente_nombre, monto) VALUES (?, ?)", [req.body.cliente_nombre, req.body.monto], () => r({ success: true }))));
fastify.patch('/api/mesas/:id', async (req) => new Promise(r => db.run("UPDATE mesas SET estado = ?, pax = ?, consumo = ?, cliente_nombre = ? WHERE id = ?", [req.body.estado, req.body.pax, req.body.consumo, req.body.cliente_nombre, req.params.id], () => r({ success: true }))));

fastify.listen({ port: 3000 });