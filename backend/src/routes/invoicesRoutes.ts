import { Router } from 'express';
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateIssueDate,
  updateInvoicePdfFileName,
  deleteInvoice,
} from '../controllers/invoicesController';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// 請求書関連のAPI（すべて管理者のみ）
router.use(requireAdmin);

router.get('/invoices', listInvoices);
router.get('/invoices/:id', getInvoice);
router.post('/invoices', createInvoice);
router.patch('/invoices/:id/issue-date', updateIssueDate);
router.patch('/invoices/:id/pdf-file-name', updateInvoicePdfFileName);
router.delete('/invoices/:id', deleteInvoice);

export default router;

