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

<table style="width:100%;border-collapse:collapse;margin-top:2rem;font-size:0.95rem;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
  <thead style="background:#c0392b;color:#fff">
    <tr>
      <th style="padding:12px">Endpoint</th>
      <th style="padding:12px">Risk</th>
      <th style="padding:12px">Fix</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9f9f9">
      <td style="padding:10px"><code><a href="/api-docs" style="color:#e74c3c">/api-docs</a></code> <br><small>Swagger UI</small></td>
      <td style="padding:10px">Unauthenticated users can enumerate &amp; invoke internal APIs.</td>
      <td style="padding:10px">Disable Swagger in prod (e.g., <code>springdoc.swagger-ui.enabled=false</code>).</td>
    </tr>
    <tr>
      <td style="padding:10px"><code><a href="/graphql" style="color:#e74c3c">/graphql</a></code> <br><small>GraphQL Playground</small></td>
      <td style="padding:10px">Introspection leaks schema; brute-force queries possible.</td>
      <td style="padding:10px">Disable <code>graphiql</code> &amp; introspection in prod; add auth/RBAC.</td>
    </tr>
    <tr style="background:#f9f9f9">
      <td style="padding:10px"><code><a href="/actuator/env" style="color:#e74c3c">/actuator/env</a></code></td>
      <td style="padding:10px">Leaks env vars &amp; secrets; some actuator routes have RCE CVEs.</td>
      <td style="padding:10px">Restrict or remove actuator endpoints in prod; auth/IP whitelist.</td>
    </tr>
    <tr>
      <td style="padding:10px"><code><a href="/admin" style="color:#e74c3c">/admin</a></code></td>
      <td style="padding:10px">No auth—anyone gets privileged access.</td>
      <td style="padding:10px">Add token/session auth &amp; IP filtering.</td>
    </tr>
    <tr style="background:#f9f9f9">
      <td style="padding:10px"><code>*</code> (CORS allow-all)</td>
      <td style="padding:10px">Malicious origins can call your APIs (CSRF-style abuse).</td>
      <td style="padding:10px">Whitelist trusted domains in CORS config.</td>
    </tr>
    <tr>
      <td style="padding:10px"><code><a href="/crash" style="color:#e74c3c">/crash</a></code></td>
      <td style="padding:10px">Stack trace reveals internal logic &amp; file paths.</td>
      <td style="padding:10px">Return generic errors to clients; log details internally.</td>
    </tr>
    <tr style="background:#f9f9f9">
      <td style="padding:10px"><code><a href="/files" style="color:#e74c3c">/files</a></code></td>
      <td style="padding:10px">Directory listing exposes secrets/logs/configs.</td>
      <td style="padding:10px">Disable auto-indexing, serve only vetted assets.</td>
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