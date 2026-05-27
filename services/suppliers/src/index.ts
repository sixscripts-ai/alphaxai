import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import supplierRoutes from './routes/supplier.routes';
import analyticsRoutes from './routes/analytics.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3009;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/suppliers', supplierRoutes);
app.use('/api/suppliers/analytics', analyticsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'suppliers-service' });
});

app.listen(port, () => {
  console.log(`Suppliers Service running on port ${port}`);
});
