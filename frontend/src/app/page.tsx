import PageHeader from './components/ui/PageHeader';
import MenuCard from './components/ui/MenuCard';

// Menu Icons
import inputIcon from '../../public/input.svg';
import editIcon from '../../public/edit.svg';
import listIcon from '../../public/list.svg';
import invoiceIcon from '../../public/invoice.svg';
import employeesIcon from '../../public/employees.svg';
import departmentIcon from '../../public/department.svg';
import productIcon from '../../public/product.svg';

export default function Page() {
  return (
    <main className="py-4">
      <PageHeader title={<>星上通信 <span className="inline_block">実績集計システム</span></>} />
      <p className="mb-4">メニューを選択してください。</p>

      {/* 共通メニュー */}
      <h2 className="h5 mb-3 fw-bold section-title">共通メニュー</h2>
      <div className="row g-3 mb-5">
        <MenuCard
          iconSrc={inputIcon}
          iconAlt="実績入力"
          title="実績入力"
          description="入力者・依頼元・製品・台数を登録します。"
          href="/input"
        />
        <MenuCard
          iconSrc={editIcon}
          iconAlt="実績修正"
          title="実績修正"
          description="登録済みの実績を検索・編集・削除します。"
          href="/edit"
        />
      </div>

      {/* 管理者メニュー */}
      <h2 className="h5 mb-3 fw-bold section-title">管理者メニュー</h2>
      <div className="row g-3">
        <MenuCard
          iconSrc={listIcon}
          iconAlt="実績一覧・請求書発行"
          title="実績一覧・請求書発行"
          description="日付と依頼元で絞り込み、合計を確認します。"
          href="/list"
        />
        <MenuCard
          iconSrc={invoiceIcon}
          iconAlt="請求書修正・再発行"
          title="請求書修正・再発行"
          description="発行済み請求書の一覧・修正・再発行ができます。"
          href="/invoices"
        />
        <MenuCard
          iconSrc={employeesIcon}
          iconAlt="入力者管理"
          title="入力者管理"
          description="入力者の登録・有効/無効の設定ができます。"
          href="/employees"
        />
        <MenuCard
          iconSrc={departmentIcon}
          iconAlt="製造依頼元管理"
          title="製造依頼元管理"
          description="製造依頼元の登録・有効/無効の設定ができます。"
          href="/departments"
        />
        <MenuCard
          iconSrc={productIcon}
          iconAlt="製品管理"
          title="製品管理"
          description="製品の登録・有効/無効の設定ができます。"
          href="/products"
        />
      </div>
    </main>
  );
}
