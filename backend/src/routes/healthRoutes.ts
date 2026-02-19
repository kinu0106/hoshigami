import { Router } from 'express';
import { getDbHealth } from '../config/db';

const router = Router();

// ヘルスチェック用のAPI
router.get('/health', async (_req, res) => {
  const db = await getDbHealth();
  res.json({ status: 'ok', db });
});

export default router;