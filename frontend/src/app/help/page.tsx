import Link from 'next/link';
import HelpSection from '../components/ui/HelpSection';

export default function HelpPage() {
  return (
    <main className="py-4">
      <h1 className="page-title mb-4">操作説明</h1>

      {/* 目次 */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h5 mb-3 fw-bold">目次</h2>
          <ul className="list-unstyled mb-0">
            <li className="mb-2"><a href="#login" className="text-decoration-none">ログイン</a></li>
            <li className="mb-2"><a href="#home" className="text-decoration-none">ホーム画面</a></li>
            <li className="mb-2"><a href="#input" className="text-decoration-none">実績入力</a></li>
            <li className="mb-2"><a href="#edit" className="text-decoration-none">実績修正</a></li>
            <li className="mb-2"><a href="#list" className="text-decoration-none">実績一覧・請求書発行（管理者用）</a></li>
            <li className="mb-2"><a href="#invoices" className="text-decoration-none">請求書修正・再発行（管理者用）</a></li>
            <li className="mb-2"><a href="#employees" className="text-decoration-none">入力者管理（管理者用）</a></li>
            <li className="mb-2"><a href="#departments" className="text-decoration-none">製造依頼元管理（管理者用）</a></li>
            <li className="mb-2"><a href="#products" className="text-decoration-none">製品管理（管理者用）</a></li>
          </ul>
        </div>
      </div>

      {/* ログイン */}
      <HelpSection id="login" title="ログイン">
        <p className="mb-3">管理者メニュー（実績一覧・請求書発行・入力者管理・製品管理）を利用する場合のみログインが必要です。</p>
        <ol>
          <li className="mb-2">パスワードを入力します</li>
          <li className="mb-2">「ログイン」ボタンをクリックします</li>
          <li className="mb-2">ログインに成功すると、管理者メニューにアクセスできるようになります</li>
        </ol>
        <div className="alert alert-info mb-0" role="alert">
          <strong>注意:</strong> 実績入力・実績修正・ホーム画面はログイン不要で利用できます。パスワードは管理者に確認してください。
        </div>
      </HelpSection>

      {/* ホーム画面 */}
      <HelpSection id="home" title="ホーム画面">
        <p className="mb-3">システムの各機能へのアクセス画面です。</p>
        <h3 className="h6 mb-2 fw-semibold">共通メニュー</h3>
        <ul className="mb-3">
          <li className="mb-2"><strong>実績入力:</strong> 新しい実績データを登録します</li>
          <li className="mb-2"><strong>実績修正:</strong> 登録済みの実績データを検索・編集・削除します</li>
        </ul>
        <h3 className="h6 mb-2 fw-semibold">管理者メニュー（管理者のみ表示）</h3>
        <ul className="mb-0">
          <li className="mb-2"><strong>実績一覧・請求書発行:</strong> 日付と製造依頼元で絞り込み、集計を確認します</li>
          <li className="mb-2"><strong>入力者管理:</strong> 入力者の追加・管理を行います</li>
          <li className="mb-2"><strong>製造依頼元管理:</strong> 製造依頼元の追加・管理を行います</li>
          <li className="mb-2"><strong>製品管理:</strong> 製品の追加・管理を行います</li>
        </ul>
      </HelpSection>

      {/* 実績入力 */}
      <HelpSection id="input" title="実績入力">
        <p className="mb-3">新しい実績データを登録する画面です。</p>
        <h3 className="h6 mb-2 fw-semibold">入力手順</h3>
        <ol className="mb-3">
          <li className="mb-2"><strong>入力日:</strong> 自動的に今日の日付が設定されます（変更できません）</li>
          <li className="mb-2"><strong>出荷日を入力:</strong> カレンダーアイコンをクリックして日付を選択します</li>
          <li className="mb-2"><strong>入力者を選択:</strong> ドロップダウンから入力者を選択します</li>
          <li className="mb-2"><strong>製造依頼元を選択:</strong> ドロップダウンから製造依頼元を選択します</li>
          <li className="mb-2"><strong>製品名を選択:</strong> 製造依頼元を選択すると、該当する製品が表示されます。製品を選択します</li>
          <li className="mb-2"><strong>備考欄を入力（任意）:</strong> 備考欄に書いたテキストは請求書の備考欄に表示されます</li>
          <li className="mb-2"><strong>数量を入力:</strong> 数値を入力します</li>
          <li className="mb-2"><strong>「追加」ボタンをクリック:</strong> 入力内容が下のテーブルに追加されます</li>
          <li className="mb-2">複数の実績を追加する場合は、2〜7の手順を繰り返します</li>
          <li className="mb-2"><strong>「まとめて保存」ボタンをクリック:</strong> 確認画面が表示されます</li>
          <li className="mb-2">確認画面で内容を確認し、「確定」ボタンをクリックして保存します</li>
        </ol>
        <div className="alert alert-warning mb-0" role="alert">
          <strong>注意:</strong> 入力日は自動的に今日の日付が設定されます。変更できません。
        </div>
      </HelpSection>

      {/* 実績修正 */}
      <HelpSection id="edit" title="実績修正">
        <p className="mb-3">登録済みの実績データを検索・編集・削除する画面です。</p>
        <h3 className="h6 mb-2 fw-semibold">検索手順</h3>
        <ol className="mb-3">
          <li className="mb-2"><strong>出荷日の開始日と終了日を入力:</strong> カレンダーアイコンをクリックして日付を選択します</li>
          <li className="mb-2"><strong>製造依頼元を選択:</strong> ドロップダウンから製造依頼元を選択します</li>
          <li className="mb-2"><strong>「検索」ボタンをクリック:</strong> 条件に一致する実績が表示されます</li>
        </ol>
        <h3 className="h6 mb-2 fw-semibold">編集・削除手順</h3>
        <ol className="mb-3">
          <li className="mb-2">検索結果のテーブルから、編集したい行を見つけます</li>
          <li className="mb-2">各項目（出荷日、製造依頼元、製品名、備考、数量）を直接編集できます</li>
          <li className="mb-2"><strong>「保存」ボタンをクリック:</strong> 変更内容が保存されます</li>
          <li className="mb-2"><strong>「削除」ボタンをクリック:</strong> 確認ダイアログが表示され、「OK」をクリックすると削除されます</li>
        </ol>
        <div className="alert alert-info mb-0" role="alert">
          <strong>注意:</strong> 検索条件を変更した場合は、「検索」ボタンを再度クリックしてください。
        </div>
      </HelpSection>

      {/* 実績一覧・請求書発行 */}
      <HelpSection id="list" title="実績一覧・請求書発行（管理者用）">
        <p className="mb-3">日付と製造依頼元で絞り込み、集計を確認する画面です。</p>
        <h3 className="h6 mb-2 fw-semibold">検索手順</h3>
        <ol className="mb-3">
          <li className="mb-2"><strong>出荷日の開始日と終了日を入力:</strong> カレンダーアイコンをクリックして日付を選択します</li>
          <li className="mb-2"><strong>製造依頼元を選択:</strong> ドロップダウンから製造依頼元を選択します（「すべて」を選択すると全件表示）</li>
          <li className="mb-2"><strong>「検索」ボタンをクリック:</strong> 条件に一致する実績が表示されます</li>
        </ol>
        <h3 className="h6 mb-2 fw-semibold">PDF出力</h3>
        <ol className="mb-3">
          <li className="mb-2">検索結果が表示されたら、「印刷方向」を選択します（横向きまたは縦向き）</li>
          <li className="mb-2"><strong>「PDF出力」ボタンをクリック:</strong> PDFファイルがダウンロードされます</li>
        </ol>
        <h3 className="h6 mb-2 fw-semibold">請求書発行</h3>
        <ol className="mb-3">
          <li className="mb-2"><strong>製造依頼元を選択:</strong> 請求書を発行するには、製造依頼元で「すべて」以外を選択する必要があります</li>
          <li className="mb-2"><strong>「検索」ボタンをクリック:</strong> 選択した製造依頼元の実績が表示されます</li>
          <li className="mb-2"><strong>請求書件名を入力（任意）:</strong> 製造依頼元で「すべて」以外を選択して検索を実行すると、請求書件名の入力欄が表示されます。検索を実行すると、「加工請求書（製造依頼元名・開始日～終了日）」という形式でデフォルト件名が自動的に設定されます。このデフォルト件名は編集可能です。</li>
          <li className="mb-2"><strong>「請求書発行」ボタンをクリック:</strong> 確認ダイアログが表示されます</li>
          <li className="mb-2">確認ダイアログで「請求書を発行します。よろしいですか？」と表示されるので、内容を確認して「確定」ボタンをクリックします</li>
          <li className="mb-2">請求書PDFがダウンロードされます。請求書には自動的に請求書番号が振られます</li>
        </ol>
        <div className="alert alert-warning mb-3" role="alert">
          <strong>注意:</strong> 請求書を発行すると請求書番号が自動的に振られます。誤って発行した場合は、PDFファイルを削除してください。請求書番号は欠番になりますが、これは正常な動作です。
        </div>
        <h3 className="h6 mb-2 fw-semibold">表示内容</h3>
        <ul className="mb-0">
          <li className="mb-2">検索結果は製造依頼元ごと、製品ごとにグループ化して表示されます</li>
          <li className="mb-2">各製品の合計台数と合計金額が表示されます</li>
          <li className="mb-2">画面下部に全体の合計金額が表示されます</li>
        </ul>
      </HelpSection>

      {/* 請求書修正・再発行 */}
      <HelpSection id="invoices" title="請求書修正・再発行（管理者用）">
        <p className="mb-3">発行済みの請求書を検索・修正・再発行・削除する画面です。</p>
        <h3 className="h6 mb-2 fw-semibold">検索手順</h3>
        <ol className="mb-3">
          <li className="mb-2"><strong>発行日の開始日と終了日を入力（任意）:</strong> 請求書の発行日で絞り込む場合に入力します</li>
          <li className="mb-2"><strong>請求書番号を入力（任意）:</strong> 特定の請求書を検索する場合に入力します（例: INV-000001）</li>
          <li className="mb-2"><strong>「検索」ボタンをクリック:</strong> 条件に一致する請求書が表示されます</li>
        </ol>
        <h3 className="h6 mb-2 fw-semibold">PDF再ダウンロード</h3>
        <ul className="mb-3">
          <li className="mb-2">一覧の「PDF再DL」ボタンをクリックすると、確認ダイアログが表示されます</li>
          <li className="mb-2">「再生成する」をクリックすると、最新のデータに基づいてPDFが再生成され、ダウンロードされます</li>
        </ul>
        <h3 className="h6 mb-2 fw-semibold">発行日修正</h3>
        <ol className="mb-3">
          <li className="mb-2">一覧の「日付修正」ボタンをクリックすると、修正ダイアログが表示されます</li>
          <li className="mb-2"><strong>新しい発行日を選択:</strong> 正しい発行日を入力します</li>
          <li className="mb-2"><strong>「修正する」ボタンをクリック:</strong> 請求書番号が新しく採番され、PDFが再生成されます</li>
        </ol>
        <div className="alert alert-warning mb-3" role="alert">
          <strong>注意:</strong> 発行日を変更すると、新しい請求書として扱われ、新しい請求書番号が割り当てられます。
        </div>
        <h3 className="h6 mb-2 fw-semibold">削除</h3>
        <ol className="mb-3">
          <li className="mb-2">一覧の「削除」ボタンをクリックすると、確認ダイアログが表示されます</li>
          <li className="mb-2"><strong>「削除する」ボタンをクリック:</strong> 請求書データが削除されます</li>
        </ol>
        <div className="alert alert-danger mb-0" role="alert">
          <strong>注意:</strong> 削除した請求書は元に戻せません。慎重に操作してください。
        </div>
      </HelpSection>

      {/* 入力者管理 */}
      <HelpSection id="employees" title="入力者管理（管理者用）">
        <p className="mb-3">入力者の追加・管理を行う画面です。</p>
        <h3 className="h6 mb-2 fw-semibold">入力者の追加</h3>
        <ol className="mb-3">
          <li className="mb-2"><strong>名前を入力:</strong> 入力者の名前を入力します</li>
          <li className="mb-2"><strong>「登録」ボタンをクリック:</strong> 入力者が追加され、下のテーブルに表示されます</li>
        </ol>
        <h3 className="h6 mb-2 fw-semibold">入力者一覧</h3>
        <ul className="mb-3">
          <li className="mb-2">登録済みの入力者がテーブルに表示されます</li>
          <li className="mb-2">入力者の名前が確認できます</li>
          <li className="mb-2">各入力者のステータス（利用中/停止中）が表示されます</li>
        </ul>
        <h3 className="h6 mb-2 fw-semibold">有効/無効の設定</h3>
        <ul className="mb-0">
          <li className="mb-2"><strong>有効:</strong> 入力者が実績入力画面で選択可能な状態です。通常は「有効」に設定します。</li>
          <li className="mb-2"><strong>無効:</strong> 入力者が実績入力画面で選択できない状態です。退職者や一時的に使用しない入力者を「無効」に設定します。</li>
          <li className="mb-2">テーブルの「操作」列のドロップダウンから「有効」または「無効」を選択することで、ステータスを変更できます</li>
          <li className="mb-2">ステータスが「停止中」の入力者は、テーブルの背景色がグレーになります</li>
        </ul>
      </HelpSection>

      {/* 製造依頼元管理 */}
      <HelpSection id="departments" title="製造依頼元管理（管理者用）">
        <p className="mb-3">製造依頼元の追加・管理を行う画面です。</p>
        <h3 className="h6 mb-2 fw-semibold">製造依頼元の追加</h3>
        <ol className="mb-3">
          <li className="mb-2"><strong>名前を入力:</strong> 製造依頼元の名前を入力します</li>
          <li className="mb-2"><strong>「登録」ボタンをクリック:</strong> 製造依頼元が追加され、下のテーブルに表示されます</li>
        </ol>
        <h3 className="h6 mb-2 fw-semibold">製造依頼元一覧</h3>
        <ul className="mb-3">
          <li className="mb-2">登録済みの製造依頼元がテーブルに表示されます</li>
          <li className="mb-2">製造依頼元の名前が確認できます</li>
          <li className="mb-2">各製造依頼元のステータス（利用中/停止中）が表示されます</li>
        </ul>
        <h3 className="h6 mb-2 fw-semibold">有効/無効の設定</h3>
        <ul className="mb-0">
          <li className="mb-2"><strong>有効:</strong> 製造依頼元が実績入力画面や実績修正画面で選択可能な状態です。通常は「有効」に設定します。</li>
          <li className="mb-2"><strong>無効:</strong> 製造依頼元が実績入力画面や実績修正画面で選択できない状態です。取引終了や一時的に使用しない製造依頼元を「無効」に設定します。</li>
          <li className="mb-2">テーブルの「操作」列のドロップダウンから「有効」または「無効」を選択することで、ステータスを変更できます</li>
          <li className="mb-2">ステータスが「停止中」の製造依頼元は、テーブルの背景色がグレーになります</li>
        </ul>
      </HelpSection>

      {/* 製品管理 */}
      <HelpSection id="products" title="製品管理（管理者用）">
        <p className="mb-3">製品の追加・管理を行う画面です。</p>
        <h3 className="h6 mb-2 fw-semibold">製品の追加</h3>
        <ol className="mb-3">
          <li className="mb-2"><strong>製品名を入力:</strong> 製品の名前を入力します</li>
          <li className="mb-2"><strong>製造依頼元を選択:</strong> ドロップダウンから製造依頼元を選択します</li>
          <li className="mb-2"><strong>単位を選択:</strong> ドロップダウンから「分」や「P」など製品に合わせた単位を選びます（必須項目です）</li>
          <li className="mb-2"><strong>単価を入力:</strong> 製品の単価を数値で入力します（例: 1000）</li>
          <li className="mb-2"><strong>「登録」ボタンをクリック:</strong> 製品が追加され、下のテーブルに表示されます</li>
        </ol>
        <h3 className="h6 mb-2 fw-semibold">製品一覧</h3>
        <ul className="mb-3">
          <li className="mb-2">登録済みの製品がテーブルに表示されます</li>
          <li className="mb-2">製造依頼元ごとに製品が表示されます</li>
          <li className="mb-2">製品名、製造依頼元、単位、単価が確認できます</li>
          <li className="mb-2">各製品のステータス（利用中/停止中）が表示されます</li>
        </ul>
        <h3 className="h6 mb-2 fw-semibold">有効/無効の設定</h3>
        <ul className="mb-0">
          <li className="mb-2"><strong>有効:</strong> 製品が実績入力画面で選択可能な状態です。通常は「有効」に設定します。</li>
          <li className="mb-2"><strong>無効:</strong> 製品が実績入力画面で選択できない状態です。製造終了品や一時的に使用しない製品を「無効」に設定します。</li>
          <li className="mb-2">テーブルの「操作」列のドロップダウンから「有効」または「無効」を選択することで、ステータスを変更できます</li>
          <li className="mb-2">ステータスが「停止中」の製品は、テーブルの背景色がグレーになります</li>
        </ul>
      </HelpSection>

      {/* よくある質問 */}
      <HelpSection id="faq" title="よくある質問">
        <div className="mb-3">
          <h3 className="h6 mb-2 fw-semibold">Q: 検索結果が表示されません</h3>
          <p className="mb-3">A: 検索条件（出荷日、製造依頼元）を確認し、「検索」ボタンを再度クリックしてください。</p>
        </div>
        <div className="mb-3">
          <h3 className="h6 mb-2 fw-semibold">Q: 実績入力画面で、製品名が表示されません</h3>
          <p className="mb-3">A: 製造依頼元を選択した後、製品名のドロップダウンに目的の製品が表示されない場合は、製品が登録されていない可能性があります。製品管理画面で、該当の製造依頼元に製品が登録されているか、管理者に確認してもらってください。また、製品のステータスが「有効」になっているかも確認してください。</p>
        </div>
        <div className="mb-3">
          <h3 className="h6 mb-2 fw-semibold">Q: PDFがダウンロードされません</h3>
          <p className="mb-3">A: ブラウザの設定でポップアップがブロックされていないか確認してください。また、検索結果が表示されていることを確認してください。</p>
        </div>
        <div className="mb-0">
          <h3 className="h6 mb-2 fw-semibold">Q: エラーメッセージが表示されます</h3>
          <p className="mb-0">A: エラーメッセージの内容を確認し、必要に応じて管理者に連絡してください。</p>
        </div>
      </HelpSection>

      <div className="mt-4 text-end">
        <Link href="/" className="btn btn-outline-secondary">HOMEに戻る</Link>
      </div>
    </main >
  );
}
