import { Router } from 'express';
import { getNextInvoiceNumber } from '../controllers/invoiceNumbersController';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// 請求書番号関連のAPI
router.use(requireAdmin);
router.get('/invoice-numbers/next', getNextInvoiceNumber);

export default router;
















