import { NextFunction, Request, Response } from 'express';

/**
 * 管理者ログインを必須にするミドルウェア
 * セッションに isAdmin が存在しない場合は 401 を返却します。
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.isAdmin) {
    next();
    return;
  }

  res.status(401).json({ ok: false, message: 'Unauthorized' });
}


