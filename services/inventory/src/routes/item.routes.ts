import { Router } from 'express';
import { createItem, getItems, getItem } from '../controllers/item.controller';
import { createTransaction } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createItem);
router.get('/', getItems);
router.get('/:id', getItem);

// Transactions
router.post('/transactions', createTransaction);

export default router;
