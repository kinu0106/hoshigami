import { Router } from 'express';
import { createProduct, listProducts, updateProduct } from '../controllers/productsController';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// 製品マスタ関連のAPI
// GETは認証不要（実績入力ページで使用）
router.get('/products', listProducts);
// POST/PUTは認証必須（管理者のみ）
router.post('/products', requireAdmin, createProduct);
router.put('/products/:id', requireAdmin, updateProduct);

export default router;


