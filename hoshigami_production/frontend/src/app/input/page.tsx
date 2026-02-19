"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PageHeader from '../components/ui/PageHeader';
import ConfirmModal from '../components/ui/ConfirmModal';
import SelectField from '../components/ui/SelectField';
import { apiGetJson, apiRequest } from "../../lib/apiClient";

type Department = { id: number; name: string };
type Employee = { id: number; name: string };
type Product = { id: number; name: string; department_id: number; unit: string; unit_price: number | string; is_active: boolean };
type Item = {
  input_date: string;
  shipment_date: string;
  employee_id: number;
  department_id: number;
  product_id: number;
  quantity: number;
  remark: string;
  product_name?: string;
  unit?: string;
};

export default function InputPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  // 入力日は常に今日の日付（固定）
  const inputDate = today;
  const [shipmentDate, setShipmentDate] = useState<string>(today);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    apiGetJson<Employee[]>('/api/employees')
      .then(setEmployees)
      .catch((err) => console.error('入力者取得エラー:', err));
    apiGetJson<Department[]>('/api/departments')
      .then(setDepartments)
      .catch((err) => console.error('部署取得エラー:', err));
  }, []);

  useEffect(() => {
    if (!departmentId) { setProducts([]); setProductId(""); return; }
    apiGetJson<Product[]>(`/api/products?department_id=${departmentId}`)
      .then((data) => {
        Array.isArray(data) ? setProducts(data) : setProducts([]);
      })
      .catch((err) => {
        console.error('製品取得エラー: department_id=', departmentId, 'error=', err);
        setProducts([]);
      });
  }, [departmentId]);

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!inputDate || !shipmentDate || !employeeId || !departmentId || !productId || !quantity) return;
    const selectedProduct = products.find(p => p.id === Number(productId));
    const it: Item = {
      input_date: inputDate,
      shipment_date: shipmentDate,
      employee_id: Number(employeeId),
      department_id: Number(departmentId),
      product_id: Number(productId),
      quantity: Number(quantity),
      remark: remark.trim(),
      product_name: selectedProduct?.name,
      unit: selectedProduct?.unit,
    };
    setItems((prev)=>[...prev, it]);
    setProductId("");
    setQuantity("");
    setRemark("");
  }

  async function submitAll() {
    if (items.length === 0) return;
    setConfirmOpen(true);
  }

  function removeAt(idx: number){
    setItems((prev)=>prev.filter((_,i)=>i!==idx));
  }

  async function doSubmit(){
    setMsg(null);
    try {
      const res = await apiRequest('/api/achievements', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) { setMsg("保存に失敗しました"); setConfirmOpen(false); return; }
      setItems([]);
      setConfirmOpen(false);
      setMsg("保存しました");
    } catch (error) {
      setMsg("保存に失敗しました");
      setConfirmOpen(false);
    }
  }

  return (
    <main className="py-4">
      <PageHeader title="実績入力" />

      <div className="card mb-3 shadow-sm">
        <div className="card-body">
      <form className="row g-3" onSubmit={addItem}>
        <div className="col-12">
          <div className="row g-3">
            <div className="col-auto">
              <label className="form-label">入力日</label>
              <input type="date" className="form-control" value={inputDate} disabled readOnly />
            </div>
            <div className="col-auto">
              <label className="form-label">出荷日</label>
              <input type="date" className="form-control" value={shipmentDate} onChange={(e)=>setShipmentDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="row g-3">
            <SelectField
              label="入力者"
              value={employeeId}
              onChange={setEmployeeId}
              options={employees}
              required
            />
            <SelectField
              label="製造依頼元"
              value={departmentId}
              onChange={setDepartmentId}
              options={departments}
              required
            />
            <SelectField
              label="製品名"
              value={productId}
              onChange={setProductId}
              options={products}
              disabled={!departmentId}
              required
            />
            <div className="col-auto">
              <label className="form-label">
                数量 <span className="text-danger">*</span>
              </label>
              <div className="d-flex align-items-center gap-2">
                <input className="form-control" type="number" min={1} value={quantity} onChange={(e)=>setQuantity(e.target.value)} />
                {productId && (() => {
                  const selectedProduct = products.find(p => p.id === Number(productId));
                  return selectedProduct?.unit ? (
                    <span className="small text-muted unit-width">{selectedProduct.unit}</span>
                  ) : null;
                })()}
              </div>
              {/* 単位が「分」の場合のヘルプテキスト（レイアウトがたつかないようにスペースを確保） */}
              <div className="input-help-text-container">
                {productId && (() => {
                  const selectedProduct = products.find(p => p.id === Number(productId));
                  if (selectedProduct?.unit === '分') {
                    return (
                      <small className="text-danger d-block">※実績時間を入力してください</small>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            <div className="col-12 col-md">
              <label className="form-label">備考</label>
              <input
                type="text"
                className="form-control"
                value={remark}
                onChange={(e)=>setRemark(e.target.value)}
              />
            </div>
            <div className="col-auto align-self-end">
              <button className="btn btn-secondary" type="submit" disabled={!shipmentDate || !employeeId || !departmentId || !productId || !quantity}>追加</button>
            </div>
          </div>
        </div>
      </form>
        </div>
      </div>

      <div className="card mb-3 shadow-sm">
        <div className="card-body">
      <div className="table-responsive js-scrollable">
        <table className="table table-sm table-bordered align-middle">
          <thead>
            <tr>
              <th>入力日</th>
              <th>出荷日</th>
              <th>入力者</th>
              <th>依頼元</th>
              <th>製品</th>
              <th>数量</th>
              <th>備考</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx)=>{
              const emp = employees.find(e=>e.id===it.employee_id)?.name ?? it.employee_id;
              const dep = departments.find(d=>d.id===it.department_id)?.name ?? it.department_id;
              const prod = products.find(p=>p.id===it.product_id)?.name ?? it.product_name ?? it.product_id;
              const unit = products.find(p=>p.id===it.product_id)?.unit ?? it.unit ?? '';
              return (
                <tr key={idx}>
                  <td>{it.input_date?.slice(0, 10)}</td>
                  <td>{it.shipment_date?.slice(0, 10)}</td>
                  <td>{emp}</td>
                  <td>{dep}</td>
                  <td>{prod}</td>
                  <td className="text-end">{it.quantity.toLocaleString()} {unit}</td>
                  <td className="text-break">{it.remark || '-'}</td>
                  <td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={()=>removeAt(idx)}>削除</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <button className="btn btn-primary" onClick={submitAll} disabled={items.length===0}>まとめて保存</button>
        <Link href="/" className="btn btn-outline-secondary">HOMEに戻る</Link>
      </div>
      {msg && <p className="mt-2">{msg}</p>}

      <ConfirmModal
        isOpen={confirmOpen}
        title="保存前の確認"
        message="以下の内容で保存します。よろしいですか？"
        onConfirm={doSubmit}
        onCancel={() => setConfirmOpen(false)}
      >
        <div className="table-responsive js-scrollable">
                  <table className="table table-sm table-bordered">
                    <thead>
                      <tr>
                <th>入力日</th>
                <th>出荷日</th>
                <th>入力者</th>
                <th>依頼元</th>
                <th>製品</th>
                <th className="text-end">数量</th>
                <th>備考</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx)=>{
                        const emp = employees.find(e=>e.id===it.employee_id)?.name ?? it.employee_id;
                        const dep = departments.find(d=>d.id===it.department_id)?.name ?? it.department_id;
                const prod = products.find(p=>p.id===it.product_id)?.name ?? it.product_name ?? it.product_id;
                const unit = products.find(p=>p.id===it.product_id)?.unit ?? it.unit ?? '';
                        return (
                  <tr key={idx}>
                    <td>{it.input_date?.slice(0, 10)}</td>
                    <td>{it.shipment_date?.slice(0, 10)}</td>
                    <td>{emp}</td>
                    <td>{dep}</td>
                    <td>{prod}</td>
                    <td className="text-end">{it.quantity.toLocaleString()} {unit}</td>
                    <td className="text-break">{it.remark || '-'}</td>
                  </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
      </ConfirmModal>
    </main>
  );
}
