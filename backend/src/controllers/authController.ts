import { Request, Response } from 'express';

export function login(req: Request, res: Response) {
  const { password } = req.body as { password?: string };
  console.log('LOGIN_DEBUG:', `Input: '${password}'`, `Correct: '${process.env.ADMIN_PASS ?? '2008'}'`);
  const ok = password === (process.env.ADMIN_PASS ?? '2008');

  if (!ok) {
    return res.status(401).json({ ok: false, message: 'Invalid credentials' });
  }

  // セッションに管理者フラグを設定
  // @ts-expect-error session any
  req.session.isAdmin = true;

  // express-sessionはres.end()が呼ばれる時に自動的にSet-Cookieヘッダーを追加する
  // trust proxy設定により、secure: trueのクッキーが正しく動作する
  res.json({ ok: true });
}

export function logout(req: Request, res: Response) {
  req.session.destroy(() => res.json({ ok: true }));
}

export function me(req: Request, res: Response) {
  // @ts-expect-error session any
  const isAdmin = !!req.session?.isAdmin;
  res.json({ ok: true, isAdmin });
}
