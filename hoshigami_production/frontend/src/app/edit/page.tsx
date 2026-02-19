"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../components/ui/PageHeader';
import DateRangeField from '../components/ui/DateRangeField';
import SelectField from '../components/ui/SelectField';
import ConfirmModal from '../components/ui/ConfirmModal';
import { apiGetJson, apiRequest } from '../../lib/apiClient';

type Department = { id: number; name: string };
type Product = { id: number; name: string; department_id: number; unit: string; unit_price: number | string; is_active: boolean };
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
  quantity: number;
  remark: string | null;
};

type EditData = {
  shipment_date: string;
  department_id: number;
  product_id: number;
  quantity: number;
  remark: string;
};

export default function EditPage() {
  const [shipmentDateFrom, setShipmentDateFrom] = useState<string>('');
  const [shipmentDateTo, setShipmentDateTo] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [productsMap, setProductsMap] = useState<Record<number, Product[]>>({});
  const [editData, setEditData] = useState<Record<number, EditData>>({});
  const [hasSearched, setHasSearched] = useState(false);
  // 検索実行時に使用した検索条件（表示にはこちらを使用）
  const [searchShipmentDateFrom, setSearchShipmentDateFrom] = useState<string>('');
  const [searchShipmentDateTo, setSearchShipmentDateTo] = useState<string>('');
  const [searchDepartmentId, setSearchDepartmentId] = useState<string>('');
  // ConfirmModal用の状態
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [saveTargetId, setSaveTargetId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(()=>{
    apiGetJson<Department[]>('/api/departments')
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data);
        } else {
          setDepartments([]);
        }
      })
      .catch((err) => {
        console.error('部署取得エラー:', err);
        setDepartments([]);
      });
  }, []);

  // 各製造依頼元の製品一覧を取得
  useEffect(() => {
    if (departments.length === 0) return;
    Promise.all(
      departments.map(d => 
        apiGetJson<Product[]>(`/api/products?department_id=${d.id}`)
          .then((products) => {
            // 配列でない場合は空配列として扱う
            const safeProducts = Array.isArray(products) ? products : [];
            return { departmentId: d.id, products: safeProducts };
          })
          .catch((err) => {
            console.error(`部署ID ${d.id} の製品取得エラー:`, err);
            return { departmentId: d.id, products: [] };
          })
      )
    ).then(results => {
      const map: Record<number, Product[]> = {};
      results.forEach(({ departmentId, products }) => {
        map[departmentId] = Array.isArray(products) ? products : [];
      });
      setProductsMap(map);
    });
  }, [departments]);

  async function onSearch(e: React.FormEvent){
    e.preventDefault();
    if(!shipmentDateFrom || !shipmentDateTo) return;
    setRows([]); // 検索前に一覧をクリア
    setEditData({}); // 編集データもクリア
    setHasSearched(false); // 検索状態をリセット
    // 検索実行時の条件をリセット（新しい検索なので）
    const q = new URLSearchParams({ 
      shipment_date_from: shipmentDateFrom, 
      shipment_date_to: shipmentDateTo,
      page:'1', 
      page_size:'50' 
    });
    // departmentIdが空でない場合のみパラメータに追加
    if (departmentId) {
      q.append('department_id', departmentId);
    }
    try {
      const data = await apiGetJson<Row[]>(`/api/achievements?${q.toString()}`);
      setRows(data || []);
      setHasSearched(true); // 検索が完了したことを記録
      // 検索実行時に使用した検索条件を保存
      setSearchShipmentDateFrom(shipmentDateFrom);
      setSearchShipmentDateTo(shipmentDateTo);
      setSearchDepartmentId(departmentId);
    } catch (error) {
      console.error('Search error:', error);
      setRows([]);
      setHasSearched(true); // エラー時も検索が試みられたことを記録
      // エラー時も検索条件を保存（検索が試みられたことを記録）
      setSearchShipmentDateFrom(shipmentDateFrom);
      setSearchShipmentDateTo(shipmentDateTo);
      setSearchDepartmentId(departmentId);
    }
  }

  function onChangeField(
    id: number,
    field: 'shipment_date' | 'department_id' | 'product_id' | 'quantity' | 'remark',
    value: string | number,
  ) {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    
    const current = editData[id] || {
      shipment_date: row.shipment_date?.slice(0, 10) || '',
      department_id: row.department_id,
      product_id: row.product_id,
    quantity: row.quantity,
    remark: row.remark ?? '',
    };
    
    if (field === 'department_id') {
      // 製造依頼元が変わったら、新しい製造依頼元の最初の製品を選択
      const newDeptId = value as number;
      const newProducts = productsMap[newDeptId] || [];
      const newProductId = newProducts.length > 0 ? newProducts[0].id : 0;
      setEditData(prev => ({
        ...prev,
        [id]: { ...current, department_id: newDeptId, product_id: newProductId }
      }));
    } else {
      setEditData(prev => ({
        ...prev,
      [id]: { ...current, [field]: field === 'remark' ? String(value) : value }
      }));
    }
  }

  function handleSaveClick(id: number) {
    const edit = editData[id];
    if (!edit) return;
    
    // バリデーション
    if (!edit.shipment_date) {
      alert('出荷日を入力してください');
      return;
    }
    if (!edit.department_id || edit.department_id === 0) {
      alert('製造依頼元を選択してください');
      return;
    }
    if (!edit.product_id || edit.product_id === 0) {
      alert('製品名を選択してください');
      return;
    }
    if (!edit.quantity || edit.quantity < 1) {
      alert('台数は1以上を入力してください');
      return;
    }
    
    setSaveTargetId(id);
    setSaveConfirmOpen(true);
  }

  async function onSave() {
    if (saveTargetId === null) return;
    const id = saveTargetId;
    const edit = editData[id];
    if (!edit) return;
    
    // 現在の行データを取得
    const row = rows.find(r => r.id === id);
    if (!row) return;
    
    const product = productsMap[edit.department_id]?.find(p => p.id === edit.product_id);
    const deptName = departments.find(d => d.id === edit.department_id)?.name || row.department_name;
    const productName = product?.name || row.product_name;
    
    const body: any = {
      shipment_date: edit.shipment_date,
      department_id: edit.department_id,
      product_id: edit.product_id,
    quantity: edit.quantity,
    remark: edit.remark?.trim?.() || null,
    };
    
    try {
      const res = await apiRequest(`/api/achievements/${id}`, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        alert('保存に失敗しました');
        setSaveConfirmOpen(false);
        setSaveTargetId(null);
        return;
      }
      
      // 保存成功メッセージ
      alert('保存しました');
    
    // ローカル状態を更新
    setRows(prev => prev.map(r => 
      r.id === id 
        ? { 
            ...r, 
            shipment_date: edit.shipment_date,
            department_id: edit.department_id,
            department_name: deptName,
            product_id: edit.product_id,
            product_name: productName,
            unit: product?.unit ?? row.unit,
            quantity: edit.quantity,
            remark: body.remark ?? null,
          }
        : r
    ));
    
    // 編集データをクリア
    setEditData(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    } catch (error) {
      alert('保存に失敗しました');
    } finally {
      setSaveConfirmOpen(false);
      setSaveTargetId(null);
    }
  }

  function handleDeleteClick(id: number) {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  }

  async function onDelete() {
    if (deleteTargetId === null) return;
    const id = deleteTargetId;
    
    try {
      const res = await apiRequest(`/api/achievements/${id}`, { method:'DELETE' });
      if (!res.ok) {
        alert('削除に失敗しました');
        return;
      }
    setRows(prev=>prev.filter(r=>r.id!==id));
    // 編集データもクリア
    setEditData(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
      alert('削除しました');
    } catch (error) {
      alert('削除に失敗しました');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  }

  return (
    <main className="py-4">
      <PageHeader title="実績修正" />
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
                  <button className="btn btn-primary w-100 w-sm-auto" type="submit" disabled={!shipmentDateFrom || !shipmentDateTo}>
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

      {hasSearched && rows.length === 0 && (
        <div className="alert alert-info mb-3" role="alert">
          検索結果がありません
        </div>
      )}

      {rows.length > 0 && (
        <div className="table-responsive js-scrollable">
        <table className="table table-sm table-striped align-middle">
          <thead>
            <tr>
              <th>入力日</th>
              <th>出荷日</th>
              <th>入力者</th>
              <th>製造依頼元</th>
              <th>製品名</th>
              <th>備考</th>
              <th className="text-end">数量</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=> {
              const edit = editData[r.id];
              const currentShipmentDate = edit?.shipment_date ?? (r.shipment_date?.slice(0, 10) || '');
              const currentDeptId = edit?.department_id ?? r.department_id;
              const currentProductId = edit?.product_id ?? r.product_id;
              const currentQuantity = edit?.quantity ?? r.quantity;
              const currentRemark = edit?.remark ?? (r.remark ?? '');
              const availableProducts = productsMap[currentDeptId] || [];
              const selectedProduct = availableProducts.find(p => p.id === currentProductId);
              const currentUnit = selectedProduct?.unit ?? r.unit ?? '';
              const hasChanges = edit !== undefined;
              
              return (
              <tr key={r.id}>
                <td>{r.input_date?.slice(0, 10)}</td>
                <td>
                  <input 
                    type="date" 
                    className="form-control form-control-sm" 
                    value={currentShipmentDate}
                    onChange={(e)=> onChangeField(r.id, 'shipment_date', e.target.value)} 
                  />
                </td>
                <td>{r.employee_name}</td>
                <td>
                  <select 
                    className="form-select form-select-sm" 
                    value={currentDeptId}
                    onChange={(e)=> onChangeField(r.id, 'department_id', Number(e.target.value))}
                  >
                    {departments.map(d=> (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select 
                    className="form-select form-select-sm" 
                    value={currentProductId || ''}
                    onChange={(e)=> {
                      const val = e.target.value;
                      if (val) onChangeField(r.id, 'product_id', Number(val));
                    }}
                    disabled={availableProducts.length === 0}
                  >
                    {currentProductId === 0 && <option value="">選択してください</option>}
                    {availableProducts.map(p=> (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={currentRemark}
                    onChange={(e)=> onChangeField(r.id, 'remark', e.target.value)}
                    placeholder=""
                  />
                </td>
                <td className="text-end">
                  <div className="d-flex justify-content-end align-items-center gap-2">
                  <input 
                    type="number" 
                    value={currentQuantity > 0 ? currentQuantity : ''}
                    min={1} 
                    className="form-control form-control-sm text-end edit-qty-input"
                    onChange={(e)=> {
                      const val = e.target.value.trim();
                      if (val === '') {
                        onChangeField(r.id, 'quantity', 0);
                      } else {
                        const numVal = Number(val);
                        // 先頭の0を除去するため、数値に変換してから設定
                        if (!isNaN(numVal) && numVal >= 0) {
                          onChangeField(r.id, 'quantity', numVal);
                        }
                      }
                    }}
                  />
                    {currentUnit && <span className="small text-muted unit-width">{currentUnit}</span>}
                  </div>
                </td>
                <td className="text-end">
                  {hasChanges && (
                    <button 
                      className="btn btn-sm btn-primary me-1" 
                      onClick={()=> handleSaveClick(r.id)}
                    >
                      保存
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-outline-danger" 
                    onClick={()=> handleDeleteClick(r.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      )}
      
      <div className="mt-4 text-end">
        <Link href="/" className="btn btn-outline-secondary">HOMEに戻る</Link>
      </div>

      {/* 保存確認モーダル */}
      {saveTargetId !== null && (() => {
        const id = saveTargetId;
        const edit = editData[id];
        const row = rows.find(r => r.id === id);
        if (!edit || !row) return null;
        
        const product = productsMap[edit.department_id]?.find(p => p.id === edit.product_id);
        const deptName = departments.find(d => d.id === edit.department_id)?.name || row.department_name;
        const productName = product?.name || row.product_name;
        const unitLabel = product?.unit || row.unit || '';
        const remarkText = (edit.remark ?? row.remark ?? '').trim();
        const quantityText = `${edit.quantity}${unitLabel ? ` ${unitLabel}` : ''}`;
        
        return (
          <ConfirmModal
            isOpen={saveConfirmOpen}
            title="保存前の確認"
            message={`以下の内容で保存しますか？\n\n出荷日: ${edit.shipment_date}\n製造依頼元: ${deptName}\n製品名: ${productName}\n数量: ${quantityText}\n備考: ${remarkText || '（備考なし）'}`}
            onConfirm={onSave}
            onCancel={() => {
              setSaveConfirmOpen(false);
              setSaveTargetId(null);
            }}
            confirmText="保存する"
            cancelText="キャンセル"
          />
        );
      })()}

      {/* 削除確認モーダル */}
      {deleteTargetId !== null && (() => {
        const id = deleteTargetId;
        const row = rows.find(r => r.id === id);
        if (!row) return null;
        
        return (
          <ConfirmModal
            isOpen={deleteConfirmOpen}
            title="削除確認"
            message={`以下の実績を削除しますか？\n\n入力日: ${row.input_date?.slice(0, 10)}\n出荷日: ${row.shipment_date?.slice(0, 10)}\n製造依頼元: ${row.department_name}\n製品名: ${row.product_name}\n台数: ${row.quantity}`}
            onConfirm={onDelete}
            onCancel={() => {
              setDeleteConfirmOpen(false);
              setDeleteTargetId(null);
            }}
            confirmText="削除する"
            cancelText="キャンセル"
          />
        );
      })()}
    </main>
  );
}
