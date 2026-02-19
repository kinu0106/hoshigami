"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '../components/ui/PageHeader';
import InputField from '../components/ui/InputField';
import SelectField from '../components/ui/SelectField';
import ConfirmModal from '../components/ui/ConfirmModal';
import { apiGetJson, apiRequest } from '../../lib/apiClient';

type Department = { id: number; name: string };
type Product = { id: number; department_id: number; name: string; unit: string; unit_price: number | string; is_active: boolean };

export default function ProductsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const unitOptions = [
    { id: '分', name: '分' },
    { id: 'P', name: 'P' },
  ];
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // 登録フォーム用のstate
  const [newProductName, setNewProductName] = useState<string>("");
  const [newProductDepartmentId, setNewProductDepartmentId] = useState<string>("");
  const [newProductUnit, setNewProductUnit] = useState<string>("");
  const [newProductUnitPrice, setNewProductUnitPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  // ConfirmModal用の状態
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [toggleTargetId, setToggleTargetId] = useState<number | null>(null);
  const [toggleTargetName, setToggleTargetName] = useState<string>('');
  const [toggleCurrentStatus, setToggleCurrentStatus] = useState<boolean>(true);
  const [toggleSelectElement, setToggleSelectElement] = useState<HTMLSelectElement | null>(null);

  useEffect(() => {
    apiGetJson<{ ok: boolean; isAdmin: boolean }>('/api/auth/me')
      .then((j) => {
        if (!j?.isAdmin) {
          router.replace('/login?redirect=/products');
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => {
        // セッション切れ時はリダイレクト
        router.replace('/login?redirect=/products');
      });
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    apiGetJson<Department[]>('/api/departments')
      .then(setDepartments)
      .catch(err => console.error("部署取得エラー:", err));
  }, [authChecked]);

  useEffect(() => {
    if (!authChecked) return;
    const fetchProducts = async () => {
      try {
        const res = await apiRequest(`/api/products?all=true`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "取得に失敗しました" }));
          if (errorData.message?.includes("is_active")) {
            setError("is_activeカラムが存在しません。データベースマイグレーションを実行してください。");
          } else {
            setError(errorData.message || "製品データの取得に失敗しました");
          }
          return;
        }
        const data = await res.json();
        setProducts(data);
        setError(null);
      } catch (err) {
        console.error("製品取得エラー:", err);
        setError("製品データの取得に失敗しました");
      }
    };
    fetchProducts();
  }, [filterDepartmentId, authChecked]);

  async function onSubmitProduct(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    
    if (!newProductName.trim()) {
      setSubmitError("製品名を入力してください");
      return;
    }
    if (!newProductDepartmentId) {
      setSubmitError("製造依頼元を選択してください");
      return;
    }
    if (!newProductUnit.trim()) {
      setSubmitError("単位を入力してください");
      return;
    }
    if (!newProductUnitPrice || Number(newProductUnitPrice) < 0) {
      setSubmitError("単価を入力してください（0以上）");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await apiRequest(`/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductName.trim(),
          department_id: Number(newProductDepartmentId),
          unit: newProductUnit.trim(),
          unit_price: Number(newProductUnitPrice),
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setSubmitError(data.message || "登録に失敗しました");
        setIsSubmitting(false);
        return;
      }
      
      // 成功時はフォームをクリアし、製品一覧を更新
      setNewProductName("");
      setNewProductDepartmentId("");
      setNewProductUnit("");
      setNewProductUnitPrice("");
      setSubmitSuccess(true);
      
      // 製品一覧を再取得
      const productsRes = await apiRequest(`/api/products?all=true`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
      
      // 成功メッセージを3秒後に消す
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error("登録エラー:", err);
      setSubmitError("登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleToggleActiveClick(productId: number, productName: string, currentStatus: boolean, selectElement: HTMLSelectElement) {
    setToggleTargetId(productId);
    setToggleTargetName(productName);
    setToggleCurrentStatus(currentStatus);
    setToggleSelectElement(selectElement);
    setToggleConfirmOpen(true);
  }

  async function onToggleActive() {
    if (toggleTargetId === null || !toggleSelectElement) return;
    
    const productId = toggleTargetId;
    const productName = toggleTargetName;
    const currentStatus = toggleCurrentStatus;
    const selectElement = toggleSelectElement;
    const newStatus = !currentStatus;

    try {
      const res = await apiRequest(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "更新に失敗しました" }));
        alert(errorData.message || "ステータスの更新に失敗しました");
        selectElement.value = currentStatus ? 'active' : 'inactive';
        setToggleConfirmOpen(false);
        setToggleTargetId(null);
        setToggleSelectElement(null);
        return;
      }

      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: newStatus } : p));
    } catch (err) {
      console.error("更新エラー:", err);
      alert("ステータスの更新に失敗しました");
      selectElement.value = currentStatus ? 'active' : 'inactive';
    } finally {
      setToggleConfirmOpen(false);
      setToggleTargetId(null);
      setToggleSelectElement(null);
    }
  }

  if (!authChecked) return <main className="py-4">チェック中...</main>;

  return (
    <main className="py-4">
      <PageHeader title="製品管理" />

      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">新規製品登録</h5>
          <form onSubmit={onSubmitProduct}>
            <div className="d-flex flex-wrap align-items-end gap-3">
              <SelectField
                label="製造依頼元"
                value={newProductDepartmentId}
                onChange={setNewProductDepartmentId}
                options={departments}
                required
                disabled={isSubmitting}
                className="form-field-flex"
              />
              <InputField
                label="製品名"
                value={newProductName}
                onChange={setNewProductName}
                placeholder="製品名を入力"
                required
                disabled={isSubmitting}
                className="form-field-flex"
              />
              <SelectField
                label="単位"
                value={newProductUnit}
                onChange={setNewProductUnit}
                options={unitOptions}
                placeholder="選択してください"
                required
                disabled={isSubmitting}
                className="form-field-unit"
              />
              <InputField
                label="単価"
                value={newProductUnitPrice}
                onChange={setNewProductUnitPrice}
                placeholder="0"
                type="number"
                min={0}
                step={1}
                required
                disabled={isSubmitting}
                className="form-field-price"
              />
              <div className="d-flex align-items-end">
                <button
                  type="submit"
                  className="btn btn-success btn-submit-min"
                  disabled={isSubmitting || !newProductName.trim() || !newProductUnit || !newProductDepartmentId || !newProductUnitPrice}
                >
                  {isSubmitting ? "登録中..." : "登録"}
                </button>
              </div>
            </div>
            {submitError && (
              <div className="alert alert-danger mt-3 mb-0" role="alert">
                {submitError}
              </div>
            )}
            {submitSuccess && (
              <div className="alert alert-success mt-3 mb-0" role="alert">
                製品を登録しました
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
            <h5 className="card-title mb-0 mb-2 mb-md-0">登録済み製品一覧</h5>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <label className="form-label mb-0 label-nowrap">製造依頼元で絞り込み:</label>
              <SelectField
                value={filterDepartmentId}
                onChange={setFilterDepartmentId}
                options={departments}
                placeholder="すべて"
                className="select-filter-width"
              />
            </div>
          </div>
          {error && (
            <div className="alert alert-warning" role="alert">
              {error}
            </div>
          )}
                     {(() => {
             const filteredProducts = filterDepartmentId
               ? products.filter(p => p.department_id === Number(filterDepartmentId))
               : products;
             
             if (filteredProducts.length === 0) {
               return <p className="text-muted mb-0">登録されている製品がありません</p>;
             }
             
             return (
               <div className="table-responsive js-scrollable" id="products-table-responsive" ref={tableRef}>
                 <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>製造依頼元</th>
                      <th>製品名</th>
                      <th>単位</th>
                      <th>単価</th>
                      <th>ステータス</th>
                      <th className="text-end">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const isActive = product.is_active;
                      const departmentName = departments.find(d => d.id === product.department_id)?.name || `ID:${product.department_id}`;
                      return (
                        <tr key={product.id} className={!isActive ? 'bg-light' : ''}>
                          <td>{departmentName}</td>
                          <td>{product.name}</td>
                          <td className="unit-width">{product.unit}</td>
                          <td>{Number(product.unit_price).toLocaleString()}円</td>
                          <td>
                            <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>
                              {isActive ? '利用中' : '停止中'}
                            </span>
                          </td>
                          <td className="text-end">
                            <select
                              className="form-select form-select-sm"
                              value={isActive ? 'active' : 'inactive'}
                              onChange={(e) => {
                                const newStatus = e.target.value === 'active';
                                if (newStatus === isActive) return;
                                handleToggleActiveClick(product.id, product.name, isActive, e.target);
                              }}
                            >
                              <option value="active">有効</option>
                              <option value="inactive">無効</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ステータス変更確認モーダル */}
      {toggleTargetId !== null && (
        <ConfirmModal
          isOpen={toggleConfirmOpen}
          title="ステータス変更確認"
          message={toggleCurrentStatus 
            ? `「${toggleTargetName}」を無効にしますか？` 
            : `「${toggleTargetName}」を有効にしますか？`}
          onConfirm={onToggleActive}
          onCancel={() => {
            if (toggleSelectElement) {
              toggleSelectElement.value = toggleCurrentStatus ? 'active' : 'inactive';
            }
            setToggleConfirmOpen(false);
            setToggleTargetId(null);
            setToggleSelectElement(null);
          }}
          confirmText="変更する"
          cancelText="キャンセル"
        />
      )}

      <div className="mt-4 text-end">
        <Link href="/" className="btn btn-outline-secondary">HOMEに戻る</Link>
      </div>
    </main>
  );
}
