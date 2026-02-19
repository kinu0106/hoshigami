import { NextFunction, Request, Response } from 'express';

/**
 * ログイン済みユーザーを必須にするミドルウェア
 * セッションに isAdmin が存在しない場合は 401 を返却します。
 * （現在のシステムでは、すべてのユーザーが管理者としてログインしている）
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.isAdmin) {
    next();
    return;
  }

  res.status(401).json({ ok: false, message: 'Unauthorized' });
}











