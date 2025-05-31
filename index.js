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
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Insecure API Demo – Security Misconfigs</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;padding:2rem;} h1{color:#c0392b;}
  table{width:100%;border-collapse:collapse;margin-top:1rem;}
  th,td{border:1px solid #ddd;padding:.6rem;vertical-align:top;}
  th{background:#f4f4f4;text-align:left;}
  code{background:#f1f1f1;border-radius:4px;padding:2px 4px;}
</style>
</head>
<body>
  <h1>🔥 Insecure API Demo – Runtime Misconfigurations</h1>
  <p>
    <strong>Purpose:</strong> Show common <em>“dev-only tools left in Production”</em> so colleagues can
    see <em>risk → impact → fix</em> in a live environment.<br/>
    <small style="color:#888;"><em>
  Created by Liangwei for internal demo and educational use only. <br/>
  This app intentionally contains insecure patterns to showcase runtime misconfigurations. <br/>
  <strong>Do not deploy in production environments.</strong>
</em></small>

  </p>

  <table>
    <tr>
      <th>🔧 Endpoint</th>
      <th>What’s Wrong / Risk</th>
      <th>How to Fix in Prod</th>
    </tr>

    <tr>
      <td><code>/api-docs/</code><br/>(Swagger UI)</td>
      <td>
        Full API blueprint &amp; “Try it out” buttons.<br/>
        Attackers enumerate endpoints → craft malicious calls.
      </td>
      <td>
        Disable UI in <code>NODE_ENV=production</code><br/>
        or behind VPN / AuthN.<br/>
        Keep spec in repo, not public.
      </td>
    </tr>

    <tr>
      <td><code>/swagger.json</code></td>
      <td>
        Raw OpenAPI spec leaked.<br/>
        Blueprint for automated fuzzing.
      </td>
      <td>
        Remove route or protect with auth; serve spec only from internal repo.
      </td>
    </tr>

    <tr>
      <td><code>/graphql</code><br/>(Playground + introspection)</td>
      <td>
        Enumerate entire schema, run queries, dump data.
      </td>
      <td>
        Set <code>graphiql:false</code>, disable introspection in prod, enforce RBAC.
      </td>
    </tr>

    <tr>
      <td><code>/actuator/env</code></td>
      <td>
        Leaks env vars (DB passwords, tokens).<br/>
        Some actuator routes have RCE CVEs.
      </td>
      <td>
        Expose only health checks.<br/>
        Gate with auth / IP allow-list; upgrade Spring Boot &amp; Cloud.
      </td>
    </tr>

    <tr>
      <td><code>/admin</code></td>
      <td>
        Unauthenticated “admin” panel → privilege escalation.
      </td>
      <td>
        Add auth middleware, move to separate service, or delete dev stub.
      </td>
    </tr>

    <tr>
      <td><code>/crash</code></td>
      <td>
        Returns full stack trace → aids targeted exploits, info-leak.
      </td>
      <td>
        Generic error handler; hide stack traces in prod logs only.
      </td>
    </tr>

    <tr>
      <td><code>/files/*</code></td>
      <td>
        Directory listing + downloadable secrets (e.g., <code>secret.txt</code>).
      </td>
      <td>
        Disable auto-indexing; store artifacts in private bucket or behind auth.
      </td>
    </tr>

    <tr>
      <td>Wildcard CORS<br/>(<code>*</code>)</td>
      <td>
        Any site’s JS can hit your API → CSRF / token theft.
      </td>
      <td>
        Pin allowed origins, use pre-flight checks, add CSRF tokens where needed.
      </td>
    </tr>
  </table>

  <p style="margin-top:2rem;">
    <strong>Demo Tip:</strong> Open browser dev-tools → Network tab, call each endpoint, then run
    a scanner (e.g., <code>nuclei</code>) to illustrate runtime detection.
  </p>
</body>
</html>
  `);
});

// Alias so scanners & bug-bounty tools detect it automatically
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/swagger-ui.html', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Start server
app.listen(port, () => {
  console.log(`🚨 Misconfig API running at http://localhost:${port}`);
});