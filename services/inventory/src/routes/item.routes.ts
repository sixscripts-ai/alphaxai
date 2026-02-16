import { Router } from 'express';
import { createItem, getItems, getItem, exportItems, importItems } from '../controllers/item.controller';
import { createTransaction } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// /api/inventory/items
router.post('/items', createItem);
router.get('/items', getItems);
router.get('/items/export', exportItems);
router.post('/items/import', importItems);
router.get('/items/:id', getItem);

// Transactions
router.post('/transactions', createTransaction);

export default router;
