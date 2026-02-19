import './globals.css';
import Image from 'next/image';
import BootstrapClient from './components/BootstrapClient';
import AuthLinks from './components/AuthLinks';
import LogoutOnUnload from './components/LogoutOnUnload';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" type="image/png" href="/favicon.ico" />
      </head>
      <body>
        <nav className="navbar navbar-custom">
          <div className="d-flex align-items-center justify-content-between w-100 navbar-header">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-link text-white d-lg-none me-2 hamburger-btn"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#sidebar"
                aria-controls="sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
                </svg>
              </button>
              <a className="navbar-brand d-flex align-items-center" href="/">
                <img src="/logo.png" alt="Hoshigami" height={56} />
              </a>
            </div>
          </div>
        </nav>
        <div className="d-flex layout-wrapper">
          {/* PC用サイドバー（左端固定） */}
          <aside className="d-none d-lg-block sidebar-pc">
            <nav className="sidebar-nav">
              <div className="mb-3">
                <h6 className="text-uppercase fw-bold menu-section-title p-3">共通メニュー</h6>
                <ul className="list-unstyled mb-0 p-3">
                  <li className="mb-2">
                    <a href="/" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                      <Image src="/home.svg" alt="" width={20} height={20} className="me-2" />
                      ホーム
                    </a>
                  </li>
                  <li className="mb-2">
                    <a href="/input" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                      <Image src="/input.svg" alt="" width={20} height={20} className="me-2" />
                      実績入力
                    </a>
                  </li>
                  <li className="mb-2">
                    <a href="/edit" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                      <Image src="/edit.svg" alt="" width={20} height={20} className="me-2" />
                      実績修正
                    </a>
                  </li>
                  <li className="mb-2">
                    <a href="/help" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center" target="_blank" rel="noopener noreferrer">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.326 7.743c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z" />
                      </svg>
                      操作説明
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mb-3 pt-3 menu-divider">
                <h6 className="text-uppercase fw-bold menu-section-title p-3">管理者メニュー</h6>
                <ul className="list-unstyled mb-0 p-3">
                  <li className="mb-2">
                    <a href="/list" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                      <Image src="/list.svg" alt="" width={20} height={20} className="me-2" />
                      実績一覧・請求書発行
                    </a>
                  </li>
                  <li className="mb-2">
                    <a href="/invoices" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                      <Image src="/invoice.svg" alt="" width={20} height={20} className="me-2" />
                      請求書修正・再発行
                    </a>
                  </li>
                  <li className="mb-2">
                    <a href="/employees" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                      <Image src="/employees.svg" alt="" width={20} height={20} className="me-2" />
                      入力者管理
                    </a>
                  </li>
                  <li className="mb-2">
                    <a href="/departments" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                      <Image src="/department.svg" alt="" width={20} height={20} className="me-2" />
                      製造依頼元管理
                    </a>
                  </li>
                  <li className="mb-2">
                    <a href="/products" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                      <Image src="/product.svg" alt="" width={20} height={20} className="me-2" />
                      製品管理
                    </a>
                  </li>
                </ul>
              </div>
              <div className="px-3 pb-3">
                <AuthLinks />
              </div>
            </nav>
          </aside>

          {/* メインコンテンツ */}
          <div className="main-content">
            <div className="app-container app-container-inner">
              {children}
            </div>
          </div>

          {/* スマホ用サイドバー（オーバーレイ） */}
          <div
            className="offcanvas offcanvas-start d-lg-none"
            tabIndex={-1}
            id="sidebar"
            aria-labelledby="sidebarLabel"
          >
            <div className="offcanvas-header">
              <h5 className="offcanvas-title" id="sidebarLabel">メニュー</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              ></button>
            </div>
            <div className="offcanvas-body">
              <nav>
                <div className="mb-3">
                  <h6 className="text-uppercase fw-bold mb-2 menu-section-title p-2">共通メニュー</h6>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <a href="/" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                        <Image src="/home.svg" alt="" width={20} height={20} className="me-2" />
                        ホーム
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="/input" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                        <Image src="/input.svg" alt="" width={20} height={20} className="me-2" />
                        実績入力
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="/edit" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                        <Image src="/edit.svg" alt="" width={20} height={20} className="me-2" />
                        実績修正
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="/help" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                          <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.326 7.743c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z" />
                        </svg>
                        操作説明
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mb-3 pt-2 menu-divider">
                  <h6 className="text-uppercase fw-bold mb-2 menu-section-title p-2">管理者メニュー</h6>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <a href="/list" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                        <Image src="/list.svg" alt="" width={20} height={20} className="me-2" />
                        実績一覧・請求書発行
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="/invoices" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                        <Image src="/invoice.svg" alt="" width={20} height={20} className="me-2" />
                        請求書修正・再発行
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="/employees" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                        <Image src="/employees.svg" alt="" width={20} height={20} className="me-2" />
                        入力者管理
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="/departments" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                        <Image src="/department.svg" alt="" width={20} height={20} className="me-2" />
                        製造依頼元管理
                      </a>
                    </li>
                    <li className="mb-2">
                      <a href="/products" className="text-decoration-none d-block p-2 rounded sidebar-link d-flex align-items-center">
                        <Image src="/product.svg" alt="" width={20} height={20} className="me-2" />
                        製品管理
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="px-2">
                  <AuthLinks />
                </div>
              </nav>
            </div>
          </div>
        </div>
        <BootstrapClient />
        <LogoutOnUnload />
      </body>
    </html>
  );
}


