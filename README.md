# Instagramの9期生強化チームポータルサイト

## 検索インデックスの更新

ノウハウ、プロンプト、ラジオ、ライブ、メンバーを追加・変更した後は、公開前に次を実行します。

```powershell
node scripts/build-search-index.mjs
```

`data/search-index.json`が再生成され、GitHub Pages上のサイト内検索に反映されます。

## ホームの月間目標と「今週やること」の更新

`data/assignments.json`を編集します。HTMLの編集は不要です。

- `period`：対象月（例：`2026-11`）。日本時間でその月になったら表示します。
- `monthlyGoal`・`weeklyDuty`・`note`：目標、担当、補足。担当が決まったら`isDutyRegistered`を`true`にします。
- `weeklyPlan.intro`：目標に合わせたおすすめの進め方の説明。
- `weeklyPlan.steps`：3ステップ。それぞれ`title`（見出し）、`description`（本文）、`label`（リンク名）、`url`（教材・シートのURL）を設定します。

「今週やること」は月間目標に沿ったおすすめとして表示します。週ごとに変えたい場合は同じファイルの3ステップを更新してください。対象月が違う場合やデータを取得できない場合は、共通の「課題を決める → 学ぶ → 試して振り返る」に戻り、前月の目標・担当は表示しません。未確定の翌月分は作る必要はありません。

公開前に`npm run validate`と`node --test tests/home-plan.test.mjs`を実行してください。
