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
    <!DOCTYPE html>
    <html>
    <head>
      <title>🔧 Security Misconfiguration Demo - Liangwei</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 2rem auto;
          max-width: 900px;
          line-height: 1.6;
        }
        h1 {
          color: #c0392b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 2rem;
        }
        th, td {
          padding: 12px;
          border: 1px solid #ddd;
          text-align: left;
        }
        th {
          background-color: #f44336;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .box {
          background: #ffe5e5;
          padding: 1rem;
          border: 1px solid #c0392b;
          margin-bottom: 2rem;
        }
        .footer {
          margin-top: 3rem;
          font-size: 0.9rem;
          color: #888;
        }
      </style>
    </head>
    <body>
      <h1>🔧 Security Misconfiguration Demo</h1>

      <div class="box">
        <h3>⚠️ Simulated Production State</h3>
        <p><strong>Last Modified By:</strong> ${productionDB.lastModifiedBy || '—'}</p>
        <p><strong>Last Modified At:</strong> ${productionDB.lastModifiedAt || '—'}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Issue</th>
            <th>Risk</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Swagger UI enabled in prod</td>
            <td>Exposes internal API; attackers may fuzz endpoints</td>
            <td>Disable in prod via config (e.g., <code>springdoc.swagger-ui.enabled=false</code>)</td>
          </tr>
          <tr>
            <td>GraphQL Playground enabled</td>
            <td>Supports introspection; can leak sensitive data</td>
            <td>Disable <code>graphiql</code> or introspection in prod</td>
          </tr>
          <tr>
            <td>CORS: Allow All</td>
            <td>Cross-origin requests can be made by malicious sites</td>
            <td>Restrict to known frontend domains only</td>
          </tr>
          <tr>
            <td>Unprotected Admin Route</td>
            <td>Anyone can access internal admin panel</td>
            <td>Enforce auth (token/session) and IP whitelisting</td>
          </tr>
          <tr>
            <td>Verbose Error Messages</td>
            <td>Stack traces can expose internal logic</td>
            <td>Use custom error pages and log details internally</td>
          </tr>
          <tr>
            <td>Static File Exposure</td>
            <td>Internal files (e.g., logs, configs) can be browsed</td>
            <td>Use `.gitignore`, block `/public` leaks, validate file paths</td>
          </tr>
          <tr>
            <td>Actuator API in prod</td>
            <td>Leaks env vars and app metadata</td>
            <td>Block access or require auth for <code>/actuator/*</code></td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        Made by Liangwei for public demo purposes only. Simulated vulnerabilities — do not use in real prod apps.
      </div>
    </body>
    </html>
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