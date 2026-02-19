import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import achievementRoutes from './routes/achievementsRoutes';
import departmentsRoutes from './routes/departmentsRoutes';
import employeesRoutes from './routes/employeesRoutes';
import productsRoutes from './routes/productsRoutes';
import invoiceNumbersRoutes from './routes/invoiceNumbersRoutes';
import invoicesRoutes from './routes/invoicesRoutes';

dotenv.config();

const app = express();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30分でセッションを失効させるための基準

// リバースプロキシ（Nginx）の背後で動作している場合、プロキシを信頼する設定が必要
// これにより、secure: trueのクッキーが正しく動作する
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(
  // セッションの基本設定（30分で失効、アクセス時に有効期限を延長）
  session({
    name: process.env.SESSION_COOKIE_NAME ?? 'hoshigami.sid',
    secret: process.env.SESSION_SECRET ?? 'change-me',
    resave: false,
    saveUninitialized: true, // trueに変更：セッションクッキーを確実に送信するため
    rolling: true,
    cookie: {
      maxAge: SESSION_TIMEOUT_MS, // 30分
      httpOnly: true, // XSS攻撃を防ぐため
      // HTTPS移行時は環境変数SESSION_SECUREをtrueに設定すること
      secure: process.env.SESSION_SECURE === 'true', // HTTPS環境ではtrueである必要がある
      sameSite: 'lax', // 同じドメイン内でのリクエストでは'lax'で問題ない
      path: '/', // すべてのパスでクッキーを送信
    },
  }),
);
app.use((req: Request, res: Response, next: NextFunction) => {
  // セッションが存在しない場合はそのまま次へ
  if (!req.session) {
    next();
    return;
  }

  const now = Date.now();
  const lastActivity = (req.session as any).lastActivity ?? now;

  // 30分間操作が無ければセッションを破棄（440は返さない）
  // 認証が必要なエンドポイントでは、requireAdminミドルウェアが401を返す
  if (now - lastActivity > SESSION_TIMEOUT_MS) {
    req.session.destroy(() => {
      // セッションを破棄して次へ進む（認証不要なエンドポイントのため）
      next();
    });
    return;
  }

  // 最終操作時刻を更新して次のミドルウェアへ
  (req.session as any).lastActivity = now;
  next();
});

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', achievementRoutes);
app.use('/api', departmentsRoutes);
app.use('/api', employeesRoutes);
app.use('/api', productsRoutes);
app.use('/api', invoiceNumbersRoutes);
app.use('/api', invoicesRoutes);

const port = Number(process.env.PORT ?? 5001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${port}`);
});


