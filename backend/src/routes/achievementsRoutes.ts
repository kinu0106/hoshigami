import { Router } from 'express';
import {
  createAchievements,
  deleteAchievement,
  getSummary,
  listAchievements,
  updateAchievement,
} from '../controllers/achievementsController';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// 実績関連のAPI
router.get('/achievements', listAchievements);
router.post('/achievements', createAchievements);
router.put('/achievements/:id', updateAchievement);
router.delete('/achievements/:id', deleteAchievement);
router.get('/summary', requireAdmin, getSummary);

export default router;


