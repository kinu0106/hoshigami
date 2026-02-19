import { Router } from 'express';
import { createDepartment, listDepartments, updateDepartment } from '../controllers/departmentsController';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// 部署マスタ関連のAPI
// GETは認証不要（実績入力ページで使用）
router.get('/departments', listDepartments);
// POST/PUTは認証必須（管理者のみ）
router.post('/departments', requireAdmin, createDepartment);
router.put('/departments/:id', requireAdmin, updateDepartment);

export default router;


