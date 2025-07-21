require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const path = require('path');
const qrRoutes = require('./routes/qrRoutes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

app.use(compression());
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} from ${req.ip}`);
  next();
});

app.get('/', (req, res) => {
  res.send('<h1>QR Code API</h1><p>Visit <a href="/api-docs">API Docs</a> or GET /api/v1/qrcode?data=YourText</p>');
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(yaml.load(path.join(__dirname, 'public/swagger.yaml'))));
app.use('/api/v1/qrcode', qrRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

