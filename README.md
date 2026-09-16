# Instagramの9期生強化チームポータルサイト

## 検索インデックスの更新

ノウハウ、プロンプト、ラジオ、ライブ、メンバーを追加・変更した後は、公開前に次を実行します。

```powershell
node scripts/build-search-index.mjs
```

`data/search-index.json`が再生成され、GitHub Pages上のサイト内検索に反映されます。
