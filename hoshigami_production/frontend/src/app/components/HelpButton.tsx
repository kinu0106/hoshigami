'use client';

import { usePathname } from 'next/navigation';

export default function HelpButton() {
  const pathname = usePathname();

  // パスに応じたヘルプセクションのIDを返す
  const getHelpSection = () => {
    if (pathname === '/login') return 'login';
    if (pathname === '/') return 'home';
    if (pathname === '/input') return 'input';
    if (pathname === '/edit') return 'edit';
    if (pathname === '/list') return 'list';
    if (pathname === '/employees') return 'employees';
    if (pathname === '/departments') return 'departments';
    if (pathname === '/products') return 'products';
    if (pathname === '/invoices') return 'invoices';
    return '';
  };

  const helpSection = getHelpSection();
  if (!helpSection) return null;

  const helpUrl = `/help#${helpSection}`;

  return (
    <a
      href={helpUrl}
      className="btn btn-sm d-flex align-items-center gap-2 help-button help-button-custom text-decoration-none"
      title="操作説明を見る"
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.326 7.743c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z" />
      </svg>
      <span className="help-button-text">操作説明</span>
    </a>
  );
}
