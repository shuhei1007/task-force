# 📊 Google スプレッドシート連携 設定マニュアル

スプレッドシートやGoogleフォームに入力するだけで、サイトが自動更新される環境のセットアップ手順です。

---

## 1. Google スプレッドシートの作成

Google ドライブで新しいスプレッドシートを作成し、下部のシート名（タブ）を以下の4つ作成します：

### ① `news` シート（お知らせ）
1行目に以下の見出し（ヘッダー）を設定します：
| date | type | typeLabel | title | url | isNew |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-09-16 | UPDATE | UPDATE | 【対談】かりんさん楽天アフィ攻略 | guides/karin-rakuten-affiliate-monetize.html | TRUE |

### ② `schedule` シート（予定）
| date | day | time | title | type | badgeClass | isLive | description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 9/16 | 水 | 21:00〜 | AI体験会 | LIVE | badge-live | TRUE | メンバー限定 |

### ③ `assignments` シート（目標・担当）
| category | item |
| :--- | :--- |
| target | 9月目標：全員フォロワー1000人達成 |
| role | 今週のラジオ担当：修平 |

### ④ `knowledge` シート（ノウハウ・フォーム回答用）
| date | category | badgeClass | title | excerpt | tags | content | isNew | author |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-09-16 | 外部インフルエンサー | badge-amber | タイトル | 要約文 | タグ1,タグ2 | ### 本文見出し\n本文内容... | TRUE | かりんさん |

---

## 2. スプレッドシートの公開設定（読み取り用）

1. スプレッドシート右上の **「共有」** をクリック
2. 一般的なアクセスを **「リンクを知っている全員（閲覧者）」** に設定
3. スプレッドシートの URL から **スプレッドシートID** をコピー
   - 例: `https://docs.google.com/spreadsheets/d/【ここの英数字がID】/edit`
4. プロジェクトの `config/sheets.json` の `"spreadsheetId"` に貼り付けます。

---

## 3. 「🚀 サイト更新」ボタンの設置（Google Apps Script）

1. スプレッドシートのメニューから **「拡張機能」 ➔ 「Apps Script」** を開く
2. 元からあるコードを消し、[`gas/Code.js`](file:///Users/okushuuhei/Desktop/Instagram/gas/Code.js) の内容をすべて貼り付けて保存（フロッピーアイコン）
3. スプレッドシートの画面を再読み込みすると、メニューバーに **「🚀 ダッシュボード連携」** が出現します。
4. **「連携設定」** から GitHub の Personal Access Token を1度登録すると、次回から **「サイトを即時更新・デプロイ」** を押すだけでサイトが自動更新されます！
