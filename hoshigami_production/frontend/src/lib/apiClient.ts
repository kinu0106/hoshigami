const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';

// 認証不要なエンドポイントのリスト
const PUBLIC_ENDPOINTS = [
  '/api/departments',
  '/api/employees',
  '/api/products',
];

function isPublicEndpoint(path: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => path.startsWith(endpoint));
}

function handleSessionTimeout(redirectPath?: string) {
  if (typeof window === 'undefined') return;
  const targetPath = redirectPath ?? `${window.location.pathname}${window.location.search}`;
  // すでにログインページの場合はメッセージのみ表示
  if (!window.location.pathname.startsWith('/login')) {
    window.alert('セッションが切れました。再度ログインしてください。');
  }
  window.location.href = `/login?redirect=${encodeURIComponent(targetPath)}`;
}

export async function apiRequest(input: string, init: RequestInit = {}): Promise<Response> {
  const requestInit: RequestInit = {
    ...init,
    credentials: init.credentials ?? 'include',
  };

  let response: Response;
  const url = `${API_BASE}${input}`;
  try {
    response = await fetch(url, requestInit);
  } catch (error) {
    // ネットワークエラー（バックエンドサーバーが起動していない、接続できない等）
    console.error('Network error:', error);
    console.error('Failed URL:', url);
    throw new Error(`バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。\n接続先: ${url}`);
  }

  // ログインエンドポイントでは401エラーをそのまま返す（エラーメッセージを表示するため）
  if (input === '/api/auth/login') {
    return response;
  }

  // 認証不要なエンドポイントでは401/440エラーを無視（セッション切れでも処理を続行）
  if ((response.status === 401 || response.status === 440) && !isPublicEndpoint(input)) {
    handleSessionTimeout();
    throw new Error('SESSION_EXPIRED');
  }

  return response;
}

export async function apiGetJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await apiRequest(input, init);
  
  // 認証不要なエンドポイントで401/440エラーの場合、空の配列を返す
  if ((response.status === 401 || response.status === 440) && isPublicEndpoint(input)) {
    return [] as T;
  }
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json() as Promise<T>;
}
