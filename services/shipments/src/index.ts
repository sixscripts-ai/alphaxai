import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import shipmentRoutes from './routes/shipment.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3011;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/shipments', shipmentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'shipments-service' });
});

app.listen(port, () => {
  console.log(`Shipments Service running on port ${port}`);
});
