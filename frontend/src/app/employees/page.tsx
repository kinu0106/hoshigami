"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '../components/ui/PageHeader';
import InputField from '../components/ui/InputField';
import ConfirmModal from '../components/ui/ConfirmModal';
import { apiGetJson, apiRequest } from '../../lib/apiClient';

type Employee = { id: number; name: string; is_active?: boolean };

export default function EmployeesPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // 登録フォーム用のstate
  const [newEmployeeName, setNewEmployeeName] = useState<string>("");
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
          router.replace('/login?redirect=/employees');
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => {
        // セッション切れ時はリダイレクト
        router.replace('/login?redirect=/employees');
      });
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    const fetchEmployees = async () => {
      try {
        const res = await apiRequest(`/api/employees?all=true`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "取得に失敗しました" }));
          if (errorData.message?.includes("is_active")) {
            setError("is_activeカラムが存在しません。データベースマイグレーションを実行してください。");
          } else {
            setError(errorData.message || "入力者データの取得に失敗しました");
          }
          return;
        }
        const data = await res.json();
        setEmployees(data);
        setError(null);
      } catch (err) {
        console.error("入力者取得エラー:", err);
        setError("入力者データの取得に失敗しました");
      }
    };
    fetchEmployees();
  }, [authChecked]);

  async function onSubmitEmployee(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    
    if (!newEmployeeName.trim()) {
      setSubmitError("名前を入力してください");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await apiRequest(`/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEmployeeName.trim(),
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setSubmitError(data.message || "登録に失敗しました");
        setIsSubmitting(false);
        return;
      }
      
      // 成功時はフォームをクリアし、入力者一覧を更新
      setNewEmployeeName("");
      setSubmitSuccess(true);
      
      // 入力者一覧を再取得
      const employeesRes = await apiRequest(`/api/employees?all=true`);
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData);
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

  function handleToggleActiveClick(employeeId: number, employeeName: string, currentStatus: boolean, selectElement: HTMLSelectElement) {
    setToggleTargetId(employeeId);
    setToggleTargetName(employeeName);
    setToggleCurrentStatus(currentStatus);
    setToggleSelectElement(selectElement);
    setToggleConfirmOpen(true);
  }

  async function onToggleActive() {
    if (toggleTargetId === null || !toggleSelectElement) return;
    
    const employeeId = toggleTargetId;
    const employeeName = toggleTargetName;
    const currentStatus = toggleCurrentStatus;
    const selectElement = toggleSelectElement;
    const newStatus = !currentStatus;

    try {
      const res = await apiRequest(`/api/employees/${employeeId}`, {
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

      // 成功時は一覧を再取得して確実に最新状態を反映
      const employeesRes = await apiRequest(`/api/employees?all=true`);
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData);
      } else {
        // 再取得に失敗した場合はローカル状態を更新
        setEmployees(prev => prev.map(e => e.id === employeeId ? { ...e, is_active: newStatus } : e));
      }
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
      <PageHeader title="入力者管理" />

      <div className="card mb-3 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">新規入力者登録</h5>
          <form onSubmit={onSubmitEmployee}>
            <div className="d-flex flex-wrap align-items-end gap-3">
              <InputField
                label="名前"
                value={newEmployeeName}
                onChange={setNewEmployeeName}
                placeholder="名前を入力"
                required
                disabled={isSubmitting}
              />
              <div className="d-flex align-items-end">
                <button
                  type="submit"
                  className="btn btn-success btn-submit-min"
                  disabled={isSubmitting || !newEmployeeName.trim()}
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
                入力者を登録しました
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">登録済み入力者一覧</h5>
          {error && (
            <div className="alert alert-warning" role="alert">
              {error}
            </div>
          )}
          {employees.length === 0 ? (
            <p className="text-muted mb-0">登録されている入力者がありません</p>
          ) : (
            <div className="table-responsive table-responsive-s js-scrollable" id="employees-table-responsive" ref={tableRef}>
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>名前</th>
                    <th>ステータス</th>
                    <th className="text-end">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const isActive = emp.is_active !== false; // undefinedの場合はtrueとみなす
                    return (
                      <tr key={emp.id} className={!isActive ? 'bg-light' : ''}>
                        <td>{emp.name}</td>
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
                              handleToggleActiveClick(emp.id, emp.name, isActive, e.target);
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
          )}
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
