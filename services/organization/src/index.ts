import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import locationRoutes from './routes/location.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/locations', locationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'organization-service' });
});

app.listen(port, () => {
  console.log(`Organization Service running on port ${port}`);
});
