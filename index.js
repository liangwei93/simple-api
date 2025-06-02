const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;


// 🔧 Simulated "Database"
let productionDB = {
  lastModifiedBy: null,
  lastModifiedAt: null
};

// 🔧 CORS Misconfiguration — allow all
app.use(cors({ origin: '*' }));

// 🔧 Swagger UI exposed in all environments
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 🔧 Swagger spec exposed directly
app.get('/swagger.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'swagger.yaml'));
});

// 🔧 GraphQL Playground (introspection enabled)
const schema = buildSchema(`
  type Query {
    hello: String
    secret: String
  }
`);
const root = {
  hello: () => 'Hello from GraphQL!',
  secret: () => '⚠️ This is a secret only meant for devs!',
};
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}));

// 🔧 Simulated Actuator (Spring Boot-style)
app.get('/actuator/env', (req, res) => {
  res.json({
    DB_USER: 'admin',
    DB_PASSWORD: 'supersecret',
    NODE_ENV: process.env.NODE_ENV || 'development',
  });
});

// 🔧 Unprotected Admin Route
app.get('/admin', (req, res) => {
  res.send('⚠️ Welcome to Admin Panel — No Auth Needed');
});

// 🔧 Verbose Error Route
app.get('/crash', (req, res) => {
  throw new Error('Simulated crash: stack trace leak');
});

// 🔧 Static file exposure (put test files in /public folder)
app.use('/files', express.static(path.join(__dirname, 'public')));

// ✅ Simple hello endpoint
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

// ───────────────────────────────────────────────────────────────
//  👇  HOME PAGE – SECURITY MISCONFIG SHOWCASE  (CISO EDU MODE)
// ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <h1>🔧 Security Misconfiguration Showcase</h1>
    <ul>
      <li>Swagger UI exposed at <a href="/api-docs">/api-docs</a></li>
      <li>Swagger spec exposed at <a href="/swagger.json">/swagger.json</a></li>
      <li>GraphQL Playground enabled at <a href="/graphql">/graphql</a></li>
      <li>Spring Boot-like actuator at <a href="/actuator/env">/actuator/env</a></li>
      <li>Unprotected Admin Panel at <a href="/admin">/admin</a></li>
      <li>Verbose Error Route at <a href="/crash">/crash</a></li>
      <li>Exposed Static Files at <a href="/files">/files</a></li>
    </ul>

    <div style="background:#ffe5e5;padding:1rem;border:1px solid #c0392b;margin-bottom:2rem;">
      <h3>⚠️ Simulated Production State</h3>
      <p><strong>Last Modified By:</strong> ${productionDB.lastModifiedBy || '—'}</p>
      <p><strong>Last Modified At:</strong> ${productionDB.lastModifiedAt || '—'}</p>
    </div>
  `);
});


// Alias so scanners & bug-bounty tools detect it automatically
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/swagger-ui.html', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.post('/api/update-config', express.json(), (req, res) => {
  const user = req.body.user || 'anonymous';
  productionDB.lastModifiedBy = user;
  productionDB.lastModifiedAt = new Date().toISOString();
  res.json({ message: '⚠️ Production config updated!', productionDB });
});


// Start server
app.listen(port, () => {
  console.log(`🚨 Misconfig API running at http://localhost:${port}`);
});