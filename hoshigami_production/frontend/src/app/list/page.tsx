"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PageHeader from '../components/ui/PageHeader';
import DateRangeField from '../components/ui/DateRangeField';
import SelectField from '../components/ui/SelectField';
import ConfirmModal from '../components/ui/ConfirmModal';
import { invoiceCompanyInfo, invoiceSettings, invoiceBankInfo, invoiceRecipientBase } from '../../config/invoiceConfig';
import { apiGetJson, apiRequest } from '../../lib/apiClient';

type Department = { id: number; name: string };
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

// 製品ごとのグループ化用の型
type ProductGroup = {
  product_id: number;
  product_name: string;
  rows: Row[];
  subtotalQuantity: number;
  subtotalAmount: number;
  unitLabel: string;
};

// 製造依頼元ごとのグループ化用の型（「すべて」選択時）
type DepartmentGroup = {
  department_id: number;
  department_name: string;
  productGroups: ProductGroup[];
  subtotalQuantity: number;
  subtotalAmount: number;
};

export default function ListPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shipmentDateFrom, setShipmentDateFrom] = useState<string>('');
  const [shipmentDateTo, setShipmentDateTo] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [invoiceSubject, setInvoiceSubject] = useState<string>('');
  const [invoiceIssueDateString, setInvoiceIssueDateString] = useState<string>(() =>
    new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceConfirmOpen, setInvoiceConfirmOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const ROWS_PER_PAGE = 15;
  const formatQuantityWithUnit = (value: number, unit?: string) =>
    unit && unit.trim().length > 0 ? `${value.toLocaleString()} ${unit}` : value.toLocaleString();
  // 検索実行時に使用した検索条件（表示にはこちらを使用）
  const [searchShipmentDateFrom, setSearchShipmentDateFrom] = useState<string>('');
  const [searchShipmentDateTo, setSearchShipmentDateTo] = useState<string>('');
  const [searchDepartmentId, setSearchDepartmentId] = useState<string>('');

  useEffect(() => {
    apiGetJson<{ ok: boolean; isAdmin: boolean }>('/api/auth/me')
      .then((j) => {
        if (!j?.isAdmin) {
          router.replace('/login?redirect=/list');
          return;
        }
        setAuthChecked(true);
      })
      .catch((err) => {
        console.error('Auth check error:', err);
        // セッション切れ等の場合はリダイレクト
        router.replace('/login?redirect=/list');
      });
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    apiGetJson<Department[]>('/api/departments')
      .then((d) => setDepartments(d))
      .catch(() => {
        // セッション切れ時は apiClient 側でハンドリング済み
      });
  }, [authChecked]);

  // 「すべて」選択時の製造依頼元ごとのグループ化
  const departmentGroups = useMemo((): DepartmentGroup[] | null => {
    const showAllDepartments = !searchDepartmentId || searchDepartmentId === '';
    if (!showAllDepartments) return null;

    // 製造依頼元でグループ化
    const deptGroups = new Map<number, Row[]>();
    rows.forEach((row) => {
      if (!deptGroups.has(row.department_id)) {
        deptGroups.set(row.department_id, []);
      }
      deptGroups.get(row.department_id)!.push(row);
    });

    // 各製造依頼元内で製品ごとにグループ化
    const result: DepartmentGroup[] = [];
    deptGroups.forEach((deptRows, deptId) => {
      const deptName = deptRows[0]?.department_name ?? '';

      // 製品ごとにグループ化
      const productGroups = new Map<number, Row[]>();
      deptRows.forEach((row) => {
        if (!productGroups.has(row.product_id)) {
          productGroups.set(row.product_id, []);
        }
        productGroups.get(row.product_id)!.push(row);
      });

      // ProductGroupの配列に変換
      const productGroupsArray: ProductGroup[] = [];
      productGroups.forEach((productRows, productId) => {
        const productName = productRows[0]?.product_name ?? '';
        const unitLabel = productRows[0]?.unit ?? '';
        const subtotalQuantity = productRows.reduce((sum, r) => sum + r.quantity, 0);
        const subtotalAmount = productRows.reduce((sum, r) => sum + Number(r.total ?? 0), 0);

        productGroupsArray.push({
          product_id: productId,
          product_name: productName,
          rows: productRows,
          subtotalQuantity,
          subtotalAmount,
          unitLabel,
        });
      });

      // 製品名でソート
      productGroupsArray.sort((a, b) => a.product_name.localeCompare(b.product_name));

      // 製造依頼元の合計を計算
      const deptSubtotalQuantity = deptRows.reduce((sum, r) => sum + r.quantity, 0);
      const deptSubtotalAmount = deptRows.reduce((sum, r) => sum + Number(r.total ?? 0), 0);

      result.push({
        department_id: deptId,
        department_name: deptName,
        productGroups: productGroupsArray,
        subtotalQuantity: deptSubtotalQuantity,
        subtotalAmount: deptSubtotalAmount,
      });
    });

    // 製造依頼元IDでソート（DBの順）
    return result.sort((a, b) => a.department_id - b.department_id);
  }, [rows, searchDepartmentId]);

  // 製品ごとにグループ化（特定の製造依頼元を選択した場合）
  const productGroups = useMemo((): ProductGroup[] | null => {
    const showAllDepartments = !searchDepartmentId || searchDepartmentId === '';
    if (showAllDepartments) return null;

    const groups = new Map<number, Row[]>();

    // 製品IDでグループ化
    rows.forEach((row) => {
      if (!groups.has(row.product_id)) {
        groups.set(row.product_id, []);
      }
      groups.get(row.product_id)!.push(row);
    });

    // ProductGroupの配列に変換し、小計を計算
    const result: ProductGroup[] = [];
    groups.forEach((groupRows, productId) => {
      const productName = groupRows[0]?.product_name ?? '';
      const unitLabel = groupRows[0]?.unit ?? '';
      const subtotalQuantity = groupRows.reduce((sum, r) => sum + r.quantity, 0);
      const subtotalAmount = groupRows.reduce((sum, r) => sum + Number(r.total ?? 0), 0);

      result.push({
        product_id: productId,
        product_name: productName,
        rows: groupRows,
        subtotalQuantity,
        subtotalAmount,
        unitLabel,
      });
    });

    // 製品名でソート
    return result.sort((a, b) => a.product_name.localeCompare(b.product_name));
  }, [rows, searchDepartmentId]);

  // 全製品の合計を計算
  const totalAmount = useMemo(() => {
    return rows.reduce((acc, r) => acc + Number(r.total ?? 0), 0);
  }, [rows]);

  const totalQuantity = useMemo(() => {
    return rows.reduce((acc, r) => acc + r.quantity, 0);
  }, [rows]);

  const selectedDepartment = useMemo(
    () => (searchDepartmentId ? departments.find((d) => d.id === Number(searchDepartmentId)) : undefined),
    [searchDepartmentId, departments]
  );

  const invoiceTaxAmount = useMemo(() => {
    const raw = totalAmount * invoiceSettings.taxRate;
    switch (invoiceSettings.roundingMode) {
      case 'floor':
        return Math.floor(raw);
      case 'ceil':
        return Math.ceil(raw);
      case 'round':
      default:
        return Math.round(raw);
    }
  }, [totalAmount]);

  const invoiceGrandTotal = useMemo(() => totalAmount + invoiceTaxAmount, [totalAmount, invoiceTaxAmount]);

  const invoicePages = useMemo(() => {
    if (rows.length === 0) return [] as Row[][];

    // 請求書発行用にデータを集約する
    // キー: product_id + unit_price + unit
    const aggregatedMap = new Map<string, Row>();

    rows.forEach((row) => {
      // 複合キーを作成 (単価と単位も区別する)
      const key = `${row.product_id}-${row.unit_price}-${row.unit}`;

      if (aggregatedMap.has(key)) {
        const existing = aggregatedMap.get(key)!;
        // 数量を加算
        const newQuantity = existing.quantity + row.quantity;
        // 金額を加算 (totalは文字列なので数値に変換して計算し、文字列に戻す)
        const newTotal = (Number(existing.total) + Number(row.total)).toString();

        aggregatedMap.set(key, {
          ...existing,
          quantity: newQuantity,
          total: newTotal,
        });
      } else {
        aggregatedMap.set(key, { ...row });
      }
    });

    // マップから配列に戻す
    const aggregatedRows = Array.from(aggregatedMap.values());

    // 製品名でソート（一覧画面のグループ化順序に合わせる）
    aggregatedRows.sort((a, b) => a.product_name.localeCompare(b.product_name));

    const pages: Row[][] = [];
    for (let i = 0; i < aggregatedRows.length; i += ROWS_PER_PAGE) {
      pages.push(aggregatedRows.slice(i, i + ROWS_PER_PAGE));
    }
    return pages;
  }, [rows]);

  const invoicePeriodLabel = useMemo(() => {
    if (!searchShipmentDateFrom || !searchShipmentDateTo) return '';
    return `${searchShipmentDateFrom} ～ ${searchShipmentDateTo}`;
  }, [searchShipmentDateFrom, searchShipmentDateTo]);

  const canGenerateInvoice = useMemo(
    () => Boolean(searchDepartmentId) && rows.length > 0 && !loading,
    [searchDepartmentId, rows.length, loading]
  );

  const invoiceTaxRatePercent = useMemo(() => Math.round(invoiceSettings.taxRate * 100), []);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!shipmentDateFrom || !shipmentDateTo) return;
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        shipment_date_from: shipmentDateFrom,
        shipment_date_to: shipmentDateTo,
        page: '1',
        page_size: '100'
      });
      // departmentIdが空でない場合のみパラメータに追加
      if (departmentId) {
        q.append('department_id', departmentId);
      }
      const res = await apiRequest(`/api/achievements?${q.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: '検索に失敗しました' }));
        throw new Error(errorData.error || `エラー: ${res.status}`);
      }
      const data: Row[] = await res.json();
      setRows(data || []);
      // 検索実行時に使用した検索条件を保存
      setSearchShipmentDateFrom(shipmentDateFrom);
      setSearchShipmentDateTo(shipmentDateTo);
      setSearchDepartmentId(departmentId);
      const deptNameForSubject = departmentId
        ? departments.find((d) => d.id === Number(departmentId))?.name ?? ''
        : '';
      const defaultSubject = departmentId && deptNameForSubject
        ? `加工請求書（${deptNameForSubject}・${shipmentDateFrom}～${shipmentDateTo}）`
        : `加工請求書（${shipmentDateFrom}～${shipmentDateTo}）`;
      setInvoiceSubject(defaultSubject);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || '検索に失敗しました');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPDF() {
    if (rows.length === 0) {
      alert('出力するデータがありません');
      return;
    }

    const element = document.getElementById('list-content');
    if (!element) {
      alert('データ一覧出力に失敗しました');
      return;
    }

    try {
      const headerElement = element.querySelector('#pdf-header') as HTMLElement;
      if (headerElement) {
        headerElement.classList.remove('d-none');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('list-content');
          if (clonedElement) {
            clonedElement.classList.add('pdf-font-base');
            const selects = clonedElement.querySelectorAll('select, input, button, form');
            selects.forEach((el) => {
              (el as HTMLElement).classList.add('d-none');
            });
            const clonedHeader = clonedDoc.getElementById('pdf-header');
            if (clonedHeader) {
              clonedHeader.classList.remove('d-none');
            }
          }
        },
      });

      if (headerElement) {
        headerElement.classList.add('d-none');
      }

      const pdf = new jsPDF(pdfOrientation, 'mm', 'a4');
      const pageWidth = pdfOrientation === 'landscape' ? 297 : 210;
      const pageHeight = pdfOrientation === 'landscape' ? 210 : 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const availableHeight = pageHeight - margin * 2;
      const imgData = canvas.toDataURL('image/png');

      if (imgHeight <= availableHeight) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        let sourceY = 0;
        let remainingHeight = imgHeight;

        while (remainingHeight > 0) {
          const pageImgHeight = Math.min(remainingHeight, availableHeight);
          const sourceHeight = (pageImgHeight / imgHeight) * canvas.height;

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
          }

          const pageImgWidth = contentWidth;
          const pageImgHeightMm = (sourceHeight * pageImgWidth) / canvas.width;

          pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, pageImgWidth, pageImgHeightMm);

          remainingHeight -= pageImgHeight;
          sourceY += sourceHeight;

          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }

      const deptName = searchDepartmentId
        ? departments.find(d => d.id === Number(searchDepartmentId))?.name?.replace(/\s/g, '_') || 'すべて'
        : 'すべて';
      const fileName = `実績一覧_${searchShipmentDateFrom}_${searchShipmentDateTo}_${deptName}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error('データ一覧出力エラー:', error);
      alert('データ一覧出力に失敗しました');
    }
  }

  async function handleInvoicePDFClick() {
    if (!searchDepartmentId) {
      alert('請求書を発行するには、製造依頼元の指定が必要です。\n検索条件の「製造依頼元」を選択してから、再度実行してください。');
      return;
    }
    if (rows.length === 0) {
      alert('請求書に出力するデータがありません');
      return;
    }
    setInvoiceConfirmOpen(true);
  }

  async function handleInvoicePDFConfirm() {
    setInvoiceConfirmOpen(false);
    if (!searchDepartmentId) {
      alert('請求書を発行するには製造依頼元を選択してください');
      return;
    }
    if (rows.length === 0) {
      alert('請求書に出力するデータがありません');
      return;
    }
    const invoiceRoot = invoiceRef.current;
    if (!invoiceRoot) {
      alert('請求書テンプレートが見つかりません');
      return;
    }

    try {
      // 請求書番号を取得
      const numberResponse = await apiGetJson<{ ok: boolean; invoiceNumber: number }>('/api/invoice-numbers/next');
      if (!numberResponse.ok || !numberResponse.invoiceNumber) {
        alert('請求書番号の取得に失敗しました');
        return;
      }
      const nextNumber = numberResponse.invoiceNumber;
      const formattedNumber = `${invoiceSettings.numberPrefix}${String(nextNumber).padStart(6, '0')}`;
      setInvoiceNumber(formattedNumber);

      setInvoiceIssueDateString(
        new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
      );

      // 番号を更新した後にPDF生成（少し待ってから）
      await new Promise((resolve) => setTimeout(resolve, 100));

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pageElements = Array.from(
        invoiceRoot.querySelectorAll('.invoice-print-page')
      ) as HTMLElement[];
      if (!pageElements.length) {
        alert('請求書ページが生成されていません');
        return;
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

      const deptFileName = selectedDepartment?.name?.replace(/\s/g, '_') ?? '未指定';
      const fileName = `請求書_${formattedNumber}_${deptFileName}_${searchShipmentDateFrom}_${searchShipmentDateTo}.pdf`;
      pdf.save(fileName);

      // データベースに請求書情報を保存
      const issueDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
      try {
        await apiRequest('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoice_number: formattedNumber,
            issue_date: issueDate,
            department_id: Number(searchDepartmentId),
            shipment_date_from: searchShipmentDateFrom,
            shipment_date_to: searchShipmentDateTo,
            pdf_file_name: fileName,
          }),
        });
      } catch (saveError: any) {
        console.error('請求書データ保存エラー:', saveError);
        // 保存に失敗してもPDFは生成済みなので警告のみ
        alert('請求書PDFは生成されましたが、データベースへの保存に失敗しました');
      }
    } catch (error) {
      console.error('請求書PDF出力エラー:', error);
      alert('請求書の出力に失敗しました');
    }
  }

  if (!authChecked) return <main className="py-4">チェック中...</main>;

  return (
    <main className="py-4">
      <PageHeader title="実績一覧・請求書発行（管理者用）" />
      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <form className="row g-3" onSubmit={onSearch}>
            <div className="col-12">
              <div className="row g-3 align-items-end">
                <DateRangeField
                  label="出荷日"
                  fromValue={shipmentDateFrom}
                  toValue={shipmentDateTo}
                  onFromChange={setShipmentDateFrom}
                  onToChange={setShipmentDateTo}
                  required
                  showValidation={!shipmentDateFrom || !shipmentDateTo}
                  className="col-auto"
                />
                <SelectField
                  label="製造依頼元"
                  value={departmentId}
                  onChange={setDepartmentId}
                  options={departments}
                  placeholder="すべて"
                  className="col-12 col-sm-auto"
                />
                <div className="col-12 col-sm-auto">
                  <button className="btn btn-primary w-100 w-sm-auto" type="submit" disabled={!shipmentDateFrom || !shipmentDateTo || loading}>
                    検索
                  </button>
                </div>
              </div>
            </div>
          </form>
          {/* エラーメッセージをフォームの下にまとめて表示 */}
          {(!shipmentDateFrom || !shipmentDateTo) && (
            <div className="mt-2">
              <small className="text-danger d-block">※出荷日を入力してください</small>
            </div>
          )}
        </div>
      </div>

      {searchShipmentDateFrom &&
        searchShipmentDateTo &&
        searchDepartmentId &&
        (
          <div className="card mb-3">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-6">
                  <label className="form-label">請求書件名</label>
                  <input
                    type="text"
                    className="form-control"
                    value={invoiceSubject}
                    onChange={(e) => setInvoiceSubject(e.target.value)}
                    placeholder="例：加工請求書（9月分）"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}

      {/* 検索条件が変更された場合の警告 */}
      {rows.length > 0 && (
        (shipmentDateFrom !== searchShipmentDateFrom ||
          shipmentDateTo !== searchShipmentDateTo ||
          departmentId !== searchDepartmentId) && (
          <div className="alert alert-warning mb-3" role="alert">
            <strong>検索条件が変更されました。</strong> 再度、検索ボタンを押してください。
          </div>
        )
      )}

      {rows.length === 0 && !loading && !error && searchShipmentDateFrom && searchShipmentDateTo && (
        <div className="alert alert-info mb-3" role="alert">
          検索結果がありません
        </div>
      )}

      {loading && (
        <div className="alert alert-info mb-3" role="alert">
          検索中...
        </div>
      )}

      {/* データ一覧出力 / 請求書発行ボタン */}
      {((departmentGroups && departmentGroups.length > 0) || (productGroups && productGroups.length > 0)) && (
        <div className="mb-3 pdf-export-section">
          <div className="d-flex flex-column flex-sm-row flex-wrap align-items-sm-center justify-content-sm-between gap-3">
            <div className="d-flex align-items-center gap-2 pdf-orientation-group">
              <label className="form-label mb-0 pdf-orientation-label">印刷方向:</label>
              <div className="btn-group" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="pdfOrientation"
                  id="pdf-landscape"
                  checked={pdfOrientation === 'landscape'}
                  onChange={() => setPdfOrientation('landscape')}
                />
                <label className="btn btn-outline-secondary" htmlFor="pdf-landscape">
                  横向き
                </label>
                <input
                  type="radio"
                  className="btn-check"
                  name="pdfOrientation"
                  id="pdf-portrait"
                  checked={pdfOrientation === 'portrait'}
                  onChange={() => setPdfOrientation('portrait')}
                />
                <label className="btn btn-outline-secondary" htmlFor="pdf-portrait">
                  縦向き
                </label>
              </div>
            </div>
            <div className="d-flex flex-row flex-sm-row gap-2">
              <button
                className="btn btn-success pdf-export-btn"
                onClick={handleExportPDF}
                disabled={loading}
              >
                データ一覧出力
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleInvoicePDFClick}
                disabled={loading}
              >
                請求書発行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 製品ごとのテーブル */}
      <div id="list-content">
        {/* PDF用ヘッダー情報（画面には表示しない） */}
        <div id="pdf-header" className="pdf-header d-none">
          <h2 className="pdf-header-title">実績一覧</h2>
          <div className="pdf-header-content">
            <div><strong>出荷日:</strong> {searchShipmentDateFrom} ～ {searchShipmentDateTo}</div>
            <div>
              <strong>製造依頼元:</strong> {
                searchDepartmentId && searchDepartmentId !== ''
                  ? (departments.find(d => d.id === Number(searchDepartmentId))?.name || 'すべて')
                  : (departments.length > 0 ? departments.map(d => d.name).join('、') : 'すべて')
              }
            </div>
            <div><strong>出力日時:</strong> {new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        {/* 「すべて」を選んだ場合：製造依頼元ごとにグループ化 */}
        {departmentGroups && departmentGroups.length > 0 && departmentGroups.map((deptGroup) => (
          <div key={deptGroup.department_id} className="mb-4" data-pdf-row="true">
            <h5 className="mb-3 px-2 py-1 bg-light rounded" data-pdf-row="true">【{deptGroup.department_name}】</h5>

            {/* 製品ごとのテーブル */}
            {deptGroup.productGroups.map((productGroup) => (
              <div key={productGroup.product_id} className="mb-3" data-pdf-row="true">
                <div className="table-responsive js-scrollable">
                  <h6 className="mb-2 px-2 py-1 text-primary fw-bold" data-pdf-row="true">■ {productGroup.product_name}</h6>
                  <table className="table table-sm table-striped table-fixed-layout">
                    <colgroup>
                      <col className="col-width-12" />
                      <col className="col-width-12" />
                      <col className="col-width-15" />
                      <col className="col-width-20" />
                      <col className="col-width-10" />
                      <col className="col-width-15" />
                      <col className="col-width-16" />
                    </colgroup>
                    <thead>
                      <tr data-pdf-row="true">
                        <th>入力日</th>
                        <th>出荷日</th>
                        <th>入力者</th>
                        <th>製造依頼元</th>
                        <th className="text-end">数量</th>
                        <th className="text-end">単価</th>
                        <th className="text-end">集計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productGroup.rows.map((r) => (
                        <tr key={r.id} data-pdf-row="true">
                          <td>{r.input_date?.slice(0, 10)}</td>
                          <td>{r.shipment_date?.slice(0, 10)}</td>
                          <td>{r.employee_name}</td>
                          <td>{r.department_name}</td>
                          <td className="text-end">{r.quantity}</td>
                          <td className="text-end">{Number(r.unit_price).toLocaleString()}</td>
                          <td className="text-end">{Number(r.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-secondary fw-bold" data-pdf-row="true">
                        <td colSpan={4} className="text-end">
                          {productGroup.product_name} 小計:
                        </td>
                        <td className="text-end">{formatQuantityWithUnit(productGroup.subtotalQuantity, productGroup.unitLabel)}</td>
                        <td className="text-end">-</td>
                        <td className="text-end">{productGroup.subtotalAmount.toLocaleString()}円</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}

            {/* 製造依頼元ごとの合計 */}
            <div className="mt-2 mb-3" data-pdf-row="true">
              <div className="alert alert-secondary mb-0" role="alert" data-pdf-row="true">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <span><strong>{deptGroup.department_name} 合計:</strong></span>
                  <span>数量合計: <strong>{deptGroup.subtotalQuantity.toLocaleString()}</strong> / 金額: <strong>{deptGroup.subtotalAmount.toLocaleString()}円</strong></span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 特定の製造依頼元を選んだ場合：製品ごとにグループ化 */}
        {productGroups && productGroups.length > 0 && productGroups.map((group) => (
          <div key={group.product_id} className="mb-4" data-pdf-row="true">
            <div className="table-responsive js-scrollable">
              <h6 className="mb-2 px-2 py-1 text-primary fw-bold" data-pdf-row="true">■ {group.product_name}</h6>
              <table className="table table-sm table-striped table-fixed-layout">
                <colgroup>
                  <col className="col-width-12" />
                  <col className="col-width-12" />
                  <col className="col-width-15" />
                  <col className="col-width-20" />
                  <col className="col-width-10" />
                  <col className="col-width-15" />
                  <col className="col-width-16" />
                </colgroup>
                <thead>
                  <tr data-pdf-row="true">
                    <th>入力日</th>
                    <th>出荷日</th>
                    <th>入力者</th>
                    <th>製造依頼元</th>
                    <th className="text-end">数量</th>
                    <th className="text-end">単価</th>
                    <th className="text-end">集計</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((r) => (
                    <tr key={r.id} data-pdf-row="true">
                      <td>{r.input_date?.slice(0, 10)}</td>
                      <td>{r.shipment_date?.slice(0, 10)}</td>
                      <td>{r.employee_name}</td>
                      <td>{r.department_name}</td>
                      <td className="text-end">{r.quantity}</td>
                      <td className="text-end">{Number(r.unit_price).toLocaleString()}</td>
                      <td className="text-end">{Number(r.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="table-secondary fw-bold" data-pdf-row="true">
                    <td colSpan={4} className="text-end">
                      {group.product_name} 小計:
                    </td>
                    <td className="text-end">{formatQuantityWithUnit(group.subtotalQuantity, group.unitLabel)}</td>
                    <td className="text-end">-</td>
                    <td className="text-end">{group.subtotalAmount.toLocaleString()}円</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}

        {/* 全製品合計 */}
        {((departmentGroups && departmentGroups.length > 0) || (productGroups && productGroups.length > 0)) && (
          <div className="mt-4 mb-4" data-pdf-row="true">
            <div className="alert alert-info" role="alert" data-pdf-row="true">
              <h5 className="alert-heading mb-2">【全製品合計】</h5>
              <div className="d-flex justify-content-between align-items-center">
                <span>数量合計: <strong>{totalQuantity.toLocaleString()}</strong></span>
                <span>金額合計: <strong>{totalAmount.toLocaleString()}円</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
      {invoicePages.length > 0 && (
        <div ref={invoiceRef} className="invoice-hidden-root">
          {invoicePages.map((pageRows, pageIndex) => {
            const fillerCount = Math.max(0, ROWS_PER_PAGE - pageRows.length);
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === invoicePages.length - 1;
            return (
              <div key={`invoice-page-${pageIndex}`} className="invoice-container invoice-print-page">
                <div className="invoice-title">請求書</div>
                <div className="invoice-meta">
                  <div>発行日: {invoiceIssueDateString}</div>
                  <div>請求書番号: {invoiceNumber || invoiceSettings.provisionalNumber}</div>
                </div>
                <div className="invoice-address">
                  <div className="invoice-recipient">
                    <p className="invoice-recipient-company">{invoiceRecipientBase.companyName}</p>
                    <p>{selectedDepartment?.name || '（製造依頼元未選択）'} 御中</p>
                  </div>
                  <div className="invoice-sender">
                    {invoiceCompanyInfo.sealImagePath && (
                      <img
                        src={invoiceCompanyInfo.sealImagePath}
                        alt="社印"
                        className="invoice-seal"
                      />
                    )}
                    <div className="invoice-sender-content">
                      <p className="invoice-sender-name">{invoiceCompanyInfo.name}</p>
                      <p>{invoiceCompanyInfo.address}</p>
                      <p>
                        TEL: {invoiceCompanyInfo.tel}
                        {invoiceCompanyInfo.fax ? `　FAX: ${invoiceCompanyInfo.fax}` : ''}
                      </p>
                      {invoiceCompanyInfo.representative && <p>{invoiceCompanyInfo.representative}</p>}
                      {invoiceCompanyInfo.registrationNumber && (
                        <p>登録番号: {invoiceCompanyInfo.registrationNumber}</p>
                      )}
                      <div className="invoice-bank mt-3">
                        <p className="fw-bold mb-1">振込先</p>
                        <p>{invoiceBankInfo.bankName}　{invoiceBankInfo.branchName}</p>
                        <p>{invoiceBankInfo.accountType}　{invoiceBankInfo.accountNumber}</p>
                        <p>{invoiceBankInfo.accountName}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="invoice-subject">
                  件名：{invoiceSubject || '件名未入力'}
                </div>
                {isFirstPage && (
                  <table className="invoice-summary-table">
                    <tbody>
                      <tr>
                        <th>ご請求金額（税込）</th>
                        <td>¥{invoiceGrandTotal.toLocaleString()}</td>
                        <th>消費税額（{invoiceTaxRatePercent}%）</th>
                        <td>¥{invoiceTaxAmount.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>品名</th>
                      <th className="text-end">数量</th>
                      <th>単位</th>
                      <th className="text-end">単価</th>
                      <th className="text-end">金額</th>
                      <th>備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.product_name}</td>
                        <td className="text-end">{row.quantity.toLocaleString()}</td>
                        <td>{row.unit}</td>
                        <td className="text-end">¥{Number(row.unit_price).toLocaleString()}</td>
                        <td className="text-end">¥{Number(row.total).toLocaleString()}</td>
                        <td>{row.remark || ''}</td>
                      </tr>
                    ))}
                    {Array.from({ length: fillerCount }).map((_, index) => (
                      <tr key={`blank-${pageIndex}-${index}`} className="invoice-blank-row">
                        <td>&nbsp;</td>
                        <td className="text-end">&nbsp;</td>
                        <td>&nbsp;</td>
                        <td className="text-end">&nbsp;</td>
                        <td className="text-end">&nbsp;</td>
                        <td>&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                  {isLastPage && (
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="text-end fw-bold">小計</td>
                        <td className="text-end fw-bold">¥{totalAmount.toLocaleString()}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="text-end fw-bold">消費税額（{invoiceTaxRatePercent}%）</td>
                        <td className="text-end fw-bold">¥{invoiceTaxAmount.toLocaleString()}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="text-end fw-bold">合計</td>
                        <td className="text-end fw-bold">¥{invoiceGrandTotal.toLocaleString()}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 text-end">
        <Link href="/" className="btn btn-outline-secondary">HOMEに戻る</Link>
      </div>

      {/* 請求書発行確認モーダル */}
      <ConfirmModal
        isOpen={invoiceConfirmOpen}
        title="請求書発行の確認"
        message="請求書を発行します。よろしいですか？"
        onConfirm={handleInvoicePDFConfirm}
        onCancel={() => setInvoiceConfirmOpen(false)}
        confirmText="確定"
        cancelText="キャンセル"
      />
    </main>
  );
}
