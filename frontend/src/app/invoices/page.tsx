"use client";
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PageHeader from '../components/ui/PageHeader';
import DateRangeField from '../components/ui/DateRangeField';
import ConfirmModal from '../components/ui/ConfirmModal';
import { apiGetJson, apiRequest } from '../../lib/apiClient';
import { invoiceSettings, invoiceCompanyInfo, invoiceBankInfo, invoiceRecipientBase } from '../../config/invoiceConfig';

type Invoice = {
  id: number;
  invoice_number: string;
  issue_date: string;
  department_id: number;
  department_name: string;
  shipment_date_from: string;
  shipment_date_to: string;
  pdf_file_path: string | null;
  pdf_file_name: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type Row = {
  id: number;
  input_date: string;
  shipment_date: string;
  employee_name: string;
  department_id: number;
  department_name: string;
  product_id: number;
  product_name: string;
  unit: string;
  remark: string | null;
  quantity: number;
  unit_price: string;
  total: string;
};

export default function InvoicesPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 検索条件
  const [issueDateFrom, setIssueDateFrom] = useState<string>('');
  const [issueDateTo, setIssueDateTo] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [hasSearched, setHasSearched] = useState(false);

  // モーダル状態
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dateEditOpen, setDateEditOpen] = useState(false);
  const [reissuePdfOpen, setReissuePdfOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [newIssueDate, setNewIssueDate] = useState<string>('');

  // 再発行用のデータ
  const [reissueRows, setReissueRows] = useState<Row[]>([]);
  const [reissueLoading, setReissueLoading] = useState(false);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  const ROWS_PER_PAGE = 15;

  useEffect(() => {
    apiGetJson<{ ok: boolean; isAdmin: boolean }>('/api/auth/me')
      .then((j) => {
        if (!j?.isAdmin) {
          router.replace('/login?redirect=/invoices');
          return;
        }
        setAuthChecked(true);
      })
      .catch((err) => {
        console.error('Auth check error:', err);
        router.replace('/login?redirect=/invoices');
      });
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    apiGetJson<{ id: number; name: string }[]>('/api/departments')
      .then((d) => setDepartments(d))
      .catch(() => {
        // セッション切れ時は apiClient 側でハンドリング済み
      });
  }, [authChecked]);

  // 検索ボタンを押すまでデータを取得しない
  // useEffect(() => {
  //   if (!authChecked) return;
  //   loadInvoices();
  // }, [authChecked]);

  async function loadInvoices() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (issueDateFrom) params.append('issue_date_from', issueDateFrom);
      if (issueDateTo) params.append('issue_date_to', issueDateTo);
      if (invoiceNumber) params.append('invoice_number', invoiceNumber);

      const data = await apiGetJson<Invoice[]>(`/api/invoices?${params.toString()}`);
      setInvoices(data);
    } catch (err: any) {
      console.error('請求書一覧取得エラー:', err);
      setError('請求書一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setHasSearched(true);
    await loadInvoices();
  }

  async function handleDeleteClick(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setDeleteConfirmOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!selectedInvoice) return;
    setDeleteConfirmOpen(false);
    try {
      await apiRequest(`/api/invoices/${selectedInvoice.id}`, { method: 'DELETE' });
      alert('請求書を削除しました');
      await loadInvoices();
    } catch (err: any) {
      console.error('削除エラー:', err);
      alert('請求書の削除に失敗しました');
    }
    setSelectedInvoice(null);
  }

  async function handleDateEditClick(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setNewIssueDate(invoice.issue_date);
    setDateEditOpen(true);
  }

  async function handleDateEditConfirm() {
    if (!selectedInvoice) return;
    setDateEditOpen(false);

    try {
      // 発行日修正APIを呼び出し
      const response = await apiRequest(
        `/api/invoices/${selectedInvoice.id}/issue-date`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_issue_date: newIssueDate }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '発行日の修正に失敗しました' }));
        throw new Error(errorData.message || '発行日の修正に失敗しました');
      }

      const responseData = await response.json() as { ok: boolean; invoice: Invoice; old_invoice_number: string };
      const newInvoice = responseData.invoice;

      // 実績データを取得
      const params = new URLSearchParams({
        shipment_date_from: selectedInvoice.shipment_date_from,
        shipment_date_to: selectedInvoice.shipment_date_to,
        department_id: String(selectedInvoice.department_id),
      });
      const rows = await apiGetJson<Row[]>(`/api/achievements?${params.toString()}`);

      if (rows.length === 0) {
        alert('発行日を修正しましたが、実績データが見つかりませんでした。');
        await loadInvoices();
        setSelectedInvoice(null);
        return;
      }

      // PDF生成前にセッションを更新（タイムアウトを防ぐため）
      await apiGetJson<{ ok: boolean; isAdmin: boolean }>('/api/auth/me');

      // 新しい請求書でPDFを再生成
      const fileName = await generateInvoicePDF(
        { ...selectedInvoice, invoice_number: newInvoice.invoice_number, issue_date: newIssueDate },
        rows,
        newInvoice.invoice_number,
        newIssueDate,
        false
      );

      // データベースのPDFファイル名を更新（セッションを再度更新）
      try {
        await apiGetJson<{ ok: boolean; isAdmin: boolean }>('/api/auth/me');
        await apiRequest(`/api/invoices/${newInvoice.id}/pdf-file-name`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdf_file_name: fileName }),
        });
      } catch (updateErr: any) {
        console.error('PDFファイル名更新エラー:', updateErr);
        // 更新に失敗してもPDFは生成済みなので警告のみ
        if (updateErr.message === 'SESSION_EXPIRED' || updateErr.message?.includes('セッション')) {
          alert('PDFは生成されましたが、データベースへの保存に失敗しました（セッション切れ）。再度ログインしてください。');
        }
      }

      alert(`発行日を修正しました。新しい請求書番号: ${newInvoice.invoice_number}\nPDFを生成しました。`);
      await loadInvoices();
    } catch (err: any) {
      console.error('発行日修正エラー:', err);
      alert(err.message || '発行日の修正に失敗しました');
    }
    setSelectedInvoice(null);
  }

  async function handleReissuePdfClick(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setReissuePdfOpen(true);
    setReissueLoading(true);

    try {
      // 対象期間の実績データを取得
      const params = new URLSearchParams({
        shipment_date_from: invoice.shipment_date_from,
        shipment_date_to: invoice.shipment_date_to,
        department_id: String(invoice.department_id),
      });
      const rows = await apiGetJson<Row[]>(`/api/achievements?${params.toString()}`);
      setReissueRows(rows);
    } catch (err: any) {
      console.error('実績データ取得エラー:', err);
      alert('実績データの取得に失敗しました');
      setReissuePdfOpen(false);
    } finally {
      setReissueLoading(false);
    }
  }

  const invoiceTaxRatePercent = Math.round(invoiceSettings.taxRate * 100);

  // 請求書テンプレートを生成してPDF化する関数
  async function generateInvoicePDF(
    invoice: Invoice,
    rows: Row[],
    invoiceNumber: string,
    issueDate: string,
    isReissue: boolean = false
  ) {
    // 同じ製品・単価のものを集計
    const aggregatedRows = rows.reduce((acc, currentRow) => {
      const key = `${currentRow.product_id}-${currentRow.unit_price}`;
      const existing = acc.find(item => `${item.product_id}-${item.unit_price}` === key);

      if (existing) {
        existing.quantity += currentRow.quantity;
        // 金額を再計算 (数量 * 単価)
        const newTotal = existing.quantity * Number(existing.unit_price);
        existing.total = String(newTotal);

        // 備考の結合（重複は除外）
        if (currentRow.remark) {
          const currentRemarks = existing.remark ? existing.remark.split(', ') : [];
          if (!currentRemarks.includes(currentRow.remark)) {
            existing.remark = existing.remark
              ? `${existing.remark}, ${currentRow.remark}`
              : currentRow.remark;
          }
        }
      } else {
        // 新しいオブジェクトとして追加（参照渡しによる予期せぬ変更を防ぐためコピー）
        acc.push({ ...currentRow });
      }
      return acc;
    }, [] as Row[]);

    // 以下の処理では集計後のデータ (aggregatedRows) を使用する
    // 合計金額の計算
    const totalAmount = aggregatedRows.reduce((acc, r) => acc + Number(r.total ?? 0), 0);
    const rawTax = totalAmount * invoiceSettings.taxRate;
    let invoiceTaxAmount: number;
    switch (invoiceSettings.roundingMode) {
      case 'floor':
        invoiceTaxAmount = Math.floor(rawTax);
        break;
      case 'ceil':
        invoiceTaxAmount = Math.ceil(rawTax);
        break;
      case 'round':
      default:
        invoiceTaxAmount = Math.round(rawTax);
        break;
    }
    const invoiceGrandTotal = totalAmount + invoiceTaxAmount;

    // ページ分割
    const pages: Row[][] = [];
    for (let i = 0; i < aggregatedRows.length; i += ROWS_PER_PAGE) {
      pages.push(aggregatedRows.slice(i, i + ROWS_PER_PAGE));
    }

    // 請求書テンプレートを動的に生成
    const tempContainer = document.createElement('div');
    tempContainer.className = 'invoice-hidden-root';
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    const issueDateString = new Date(issueDate).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const selectedDepartment = departments.find((d) => d.id === invoice.department_id);
    const invoiceSubject = `加工請求書（${selectedDepartment?.name ?? ''}・${invoice.shipment_date_from}～${invoice.shipment_date_to}）`;

    pages.forEach((pageRows, pageIndex) => {
      const fillerCount = Math.max(0, ROWS_PER_PAGE - pageRows.length);
      const isFirstPage = pageIndex === 0;
      const isLastPage = pageIndex === pages.length - 1;

      const pageDiv = document.createElement('div');
      pageDiv.className = 'invoice-container invoice-print-page';

      pageDiv.innerHTML = `
        <div class="invoice-title">請求書</div>
        <div class="invoice-meta">
          <div>発行日: ${issueDateString}</div>
          <div>請求書番号: ${invoiceNumber}</div>
        </div>
        <div class="invoice-address">
          <div class="invoice-recipient">
            <p class="invoice-recipient-company">${invoiceRecipientBase.companyName}</p>
            <p>${selectedDepartment?.name ?? '（製造依頼元未選択）'} 御中</p>
          </div>
          <div class="invoice-sender">
            ${invoiceCompanyInfo.sealImagePath ? `<img src="${invoiceCompanyInfo.sealImagePath}" alt="社印" class="invoice-seal" />` : ''}
            <div class="invoice-sender-content">
              <p class="invoice-sender-name">${invoiceCompanyInfo.name}</p>
              <p>${invoiceCompanyInfo.address}</p>
              <p>TEL: ${invoiceCompanyInfo.tel}${invoiceCompanyInfo.fax ? `　FAX: ${invoiceCompanyInfo.fax}` : ''}</p>
              ${invoiceCompanyInfo.representative ? `<p>${invoiceCompanyInfo.representative}</p>` : ''}
              ${invoiceCompanyInfo.registrationNumber ? `<p>登録番号: ${invoiceCompanyInfo.registrationNumber}</p>` : ''}
              <div class="invoice-bank mt-3">
                <p class="fw-bold mb-1">振込先</p>
                <p>${invoiceBankInfo.bankName}　${invoiceBankInfo.branchName}</p>
                <p>${invoiceBankInfo.accountType}　${invoiceBankInfo.accountNumber}</p>
                <p>${invoiceBankInfo.accountName}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="invoice-subject">件名：${invoiceSubject}</div>
        ${isFirstPage ? `
          <table class="invoice-summary-table">
            <tbody>
              <tr>
                <th>ご請求金額（税込）</th>
                <td>¥${invoiceGrandTotal.toLocaleString()}</td>
                <th>消費税額（${invoiceTaxRatePercent}%）</th>
                <td>¥${invoiceTaxAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        ` : ''}
        <table class="invoice-table">
          <thead>
            <tr>
              <th>品名</th>
              <th class="text-end">数量</th>
              <th>単位</th>
              <th class="text-end">単価</th>
              <th class="text-end">金額</th>
              <th>備考</th>
            </tr>
          </thead>
          <tbody>
            ${pageRows
          .map(
            (row) => `
              <tr>
                <td>${row.product_name}</td>
                <td class="text-end">${row.quantity.toLocaleString()}</td>
                <td>${row.unit}</td>
                <td class="text-end">¥${Number(row.unit_price).toLocaleString()}</td>
                <td class="text-end">¥${Number(row.total).toLocaleString()}</td>
                <td>${row.remark || ''}</td>
              </tr>
            `
          )
          .join('')}
            ${Array.from({ length: fillerCount })
          .map(
            (_, index) => `
              <tr class="invoice-blank-row">
                <td>&nbsp;</td>
                <td class="text-end">&nbsp;</td>
                <td>&nbsp;</td>
                <td class="text-end">&nbsp;</td>
                <td class="text-end">&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            `
          )
          .join('')}
          </tbody>
          ${isLastPage ? `
            <tfoot>
              <tr>
                <td colSpan="4" class="text-end fw-bold">小計</td>
                <td class="text-end fw-bold">¥${totalAmount.toLocaleString()}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan="4" class="text-end fw-bold">消費税額（${invoiceTaxRatePercent}%）</td>
                <td class="text-end fw-bold">¥${invoiceTaxAmount.toLocaleString()}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan="4" class="text-end fw-bold">合計</td>
                <td class="text-end fw-bold">¥${invoiceGrandTotal.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          ` : ''}
        </table>
      `;

      tempContainer.appendChild(pageDiv);
    });

    // 少し待ってからPDF生成
    await new Promise((resolve) => setTimeout(resolve, 100));

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageElements = Array.from(tempContainer.querySelectorAll('.invoice-print-page')) as HTMLElement[];
    if (!pageElements.length) {
      document.body.removeChild(tempContainer);
      throw new Error('請求書ページが生成されていません');
    }

    for (let i = 0; i < pageElements.length; i += 1) {
      const pageElement = pageElements[i];
      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const renderedHeight = (canvas.height / canvas.width) * pdfWidth;
      const drawHeight = Math.min(renderedHeight, pdfHeight);

      const imgData = canvas.toDataURL('image/png');
      if (i > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, drawHeight);
    }

    // 一時要素を削除
    document.body.removeChild(tempContainer);

    const deptFileName = selectedDepartment?.name?.replace(/\s/g, '_') ?? '未指定';
    const fileName = `請求書_${invoiceNumber}_${deptFileName}_${invoice.shipment_date_from}_${invoice.shipment_date_to}.pdf`;
    pdf.save(fileName);

    return fileName;
  }

  async function handleReissuePdfConfirm() {
    if (!selectedInvoice || reissueRows.length === 0) return;
    setReissuePdfOpen(false);

    try {
      // PDF生成前にセッションを更新（タイムアウトを防ぐため）
      await apiGetJson<{ ok: boolean; isAdmin: boolean }>('/api/auth/me');

      await generateInvoicePDF(
        selectedInvoice,
        reissueRows,
        selectedInvoice.invoice_number,
        selectedInvoice.issue_date,
        true
      );
      alert('PDFを再生成しました');
    } catch (err: any) {
      console.error('PDF再生成エラー:', err);
      if (err.message === 'SESSION_EXPIRED' || err.message?.includes('セッション')) {
        alert('セッションが切れました。再度ログインしてください。');
        router.replace('/login?redirect=/invoices');
      } else {
        alert('PDFの再生成に失敗しました');
      }
    }
    setSelectedInvoice(null);
    setReissueRows([]);
  }

  if (!authChecked) return <main className="py-4">チェック中...</main>;

  return (
    <main className="py-4">
      <PageHeader title="請求書修正・再発行" />
      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <form className="row g-3" onSubmit={handleSearch}>
            <DateRangeField
              label="発行日"
              fromValue={issueDateFrom}
              toValue={issueDateTo}
              onFromChange={setIssueDateFrom}
              onToChange={setIssueDateTo}
            />
            <div className="col-md-4">
              <label className="form-label">請求書番号</label>
              <input
                type="text"
                className="form-control"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="例: INV-000001"
              />
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '検索中...' : '検索'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary ms-2"
                onClick={() => {
                  setIssueDateFrom('');
                  setIssueDateTo('');
                  setInvoiceNumber('');
                  setHasSearched(false);
                  setInvoices([]);
                }}
              >
                クリア
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">発行済み請求書一覧</h5>
          {loading ? (
            <div className="text-center py-4">読み込み中...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-4 text-muted">
              {!hasSearched
                ? '条件を指定して検索ボタンを押してください'
                : '請求書が見つかりません'}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>発行日</th>
                    <th>請求書番号</th>
                    <th>製造依頼元</th>
                    <th>対象期間</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{new Date(invoice.issue_date).toLocaleDateString('ja-JP')}</td>
                      <td>{invoice.invoice_number}</td>
                      <td>{invoice.department_name}</td>
                      <td>
                        {new Date(invoice.shipment_date_from).toLocaleDateString('ja-JP')} ～{' '}
                        {new Date(invoice.shipment_date_to).toLocaleDateString('ja-JP')}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleReissuePdfClick(invoice)}
                            title="PDF再ダウンロード"
                          >
                            PDF再DL
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-warning"
                            onClick={() => handleDateEditClick(invoice)}
                            title="発行日修正"
                          >
                            日付修正
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteClick(invoice)}
                            title="削除"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 削除確認モーダル */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="請求書の削除"
        message={`請求書番号「${selectedInvoice?.invoice_number}」を削除しますか？\nこの操作は取り消せません。`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setSelectedInvoice(null);
        }}
        confirmText="削除する"
        cancelText="キャンセル"
      />

      {/* 発行日修正モーダル */}
      <ConfirmModal
        isOpen={dateEditOpen}
        title="発行日の修正"
        message={`請求書番号「${selectedInvoice?.invoice_number}」の発行日を修正します。\n新しい請求書番号が発行されます。`}
        onConfirm={handleDateEditConfirm}
        onCancel={() => {
          setDateEditOpen(false);
          setSelectedInvoice(null);
        }}
        confirmText="修正する"
        cancelText="キャンセル"
      >
        <div className="mb-3">
          <label className="form-label">新しい発行日</label>
          <input
            type="date"
            className="form-control"
            value={newIssueDate}
            onChange={(e) => setNewIssueDate(e.target.value)}
            required
          />
        </div>
      </ConfirmModal>

      {/* PDF再発行確認モーダル */}
      <ConfirmModal
        isOpen={reissuePdfOpen}
        title="PDF再ダウンロード"
        message={`請求書番号「${selectedInvoice?.invoice_number}」のPDFを再生成してダウンロードします。\nデータは変更されません。`}
        onConfirm={handleReissuePdfConfirm}
        onCancel={() => {
          setReissuePdfOpen(false);
          setSelectedInvoice(null);
          setReissueRows([]);
        }}
        confirmText="再生成する"
        cancelText="キャンセル"
      >
        {reissueLoading && <div className="text-center py-2">データを読み込み中...</div>}
      </ConfirmModal>
    </main>
  );
}

