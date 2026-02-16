import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import teamRoutes from './routes/team.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3010;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/team', teamRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'team-service' });
});

app.listen(port, () => {
  console.log(`Team Service running on port ${port}`);
});
