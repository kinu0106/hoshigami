import { Router } from 'express';
import { createEmployee, listEmployees, updateEmployee } from '../controllers/employeesController';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// 入力者マスタ関連のAPI
// GETは認証不要（実績入力ページで使用）
router.get('/employees', listEmployees);
// POST/PUTは認証必須（管理者のみ）
router.post('/employees', requireAdmin, createEmployee);
router.put('/employees/:id', requireAdmin, updateEmployee);

export default router;


