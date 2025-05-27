const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();
const port = 3000;

// Swagger UI exposed in all environments (even production)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));




app.get('/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

