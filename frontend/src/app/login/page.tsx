"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "../../lib/apiClient";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await apiRequest("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        throw new Error("※パスワードが違います");
      }

      // レスポンスのJSONを取得（デバッグ用）
      const result = await res.json();
      console.log('Login successful:', result);

      // リダイレクト先がある場合はそこに、なければ管理者メニューの/listに
      const redirectTo = searchParams.get("redirect") || "/list";

      // ログイン成功後の遷移中であることを示すフラグを設定
      // これにより、LogoutOnUnloadがログアウトAPIを呼ばないようにする
      sessionStorage.setItem('login_redirecting', 'true');

      // Next.jsのrouter.pushを使用することで、basePathが自動的に考慮される
      console.log('Redirecting to:', redirectTo);
      router.push(redirectTo);
    } catch (err: any) {
      // エラーメッセージを表示（ネットワークエラーの場合は分かりやすいメッセージ）
      if (err.message && err.message.includes('バックエンドサーバー')) {
        setMsg(err.message);
      } else if (err.message && err.message.includes('Failed to fetch')) {
        setMsg('バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。');
      } else {
        setMsg(err.message ?? "エラー");
      }
    }
  }

  return (
    <main className="login-container position-relative">
      <div className="login-card-wrapper">
        <div className="card shadow-lg login-card">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <h1 className="h3 mb-2 fw-bold">ログイン</h1>
              <p className="text-muted small">星上通信 実績集計システム</p>
            </div>
            <form onSubmit={onSubmit} className="login-form">
              <div className="mb-4">
                <label className="form-label fw-semibold">パスワード</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control form-control-lg"
                  placeholder="パスワードを入力してください"
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 btn-lg mb-3">ログイン</button>
              {msg && <div className="alert alert-danger mb-0" role="alert">{msg}</div>}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <LoginForm />
    </Suspense>
  );
}


