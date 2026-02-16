import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import itemRoutes from './routes/item.routes';
import analyticsRoutes from './routes/analytics.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/inventory/analytics', analyticsRoutes);
app.use('/api/inventory', itemRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'inventory-service' });
});

app.listen(port, () => {
  console.log(`Inventory Service running on port ${port}`);
});
