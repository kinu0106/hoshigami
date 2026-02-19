import { Router } from 'express';
import { login, logout, me } from '../controllers/authController';

const router = Router();

// 認証関連のAPI
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', me);

export default router;


