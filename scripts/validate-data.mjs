import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

const errors = [];
const warnings = [];

function addError(file, message, details = '') {
  errors.push({ file, message, details });
}

function addWarning(file, message, details = '') {
  warnings.push({ file, message, details });
}

// 日付形式チェック (YYYY-MM-DD)
function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
}

// リンク切れチェック（内部リンク）
function checkUrlExists(urlStr, sourceFile, itemId) {
  if (!urlStr || typeof urlStr !== 'string') return;
  const cleanUrl = urlStr.split('#')[0].split('?')[0].trim();
  if (!cleanUrl) return;

  // 外部リンク（http/https）はスキップ
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('mailto:')) {
    return;
  }

  // ローカルファイルのパス解決
  const relativePath = cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl;
  const targetPath = path.join(rootDir, relativePath);

  if (!fs.existsSync(targetPath)) {
    addError(
      sourceFile,
      `🔗 リンク切れを検出しました: "${urlStr}"`,
      `項目ID: [${itemId}] - ファイル "${relativePath}" がリポジトリ内に存在しません。`
    );
  }
}

// 1. JSONファイルの読み込み＆構文チェック
function loadAndValidateJSON(fileName) {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) {
    addWarning(fileName, `ファイルが存在しません: ${fileName}`);
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    addError(fileName, `❌ JSON構文エラー（フォーマットが不正です）`, err.message);
    return null;
  }
}

console.log('🔍 [品質保証] データ整合性・バリデーションチェックを開始します...\n');

const allIds = new Map(); // id -> fileName

// --- A. news.json の検証 ---
const news = loadAndValidateJSON('news.json');
if (Array.isArray(news)) {
  news.forEach((item, idx) => {
    const id = item.id || `(インデックス ${idx})`;

    // 必須項目
    if (!item.id) addError('news.json', `必須項目 'id' がありません`, `項目: ${JSON.stringify(item)}`);
    if (!item.title) addError('news.json', `必須項目 'title' がありません`, `項目ID: ${id}`);
    if (!item.date) addError('news.json', `必須項目 'date' がありません`, `項目ID: ${id}`);
    if (!item.url) addWarning('news.json', `'url' が未設定です`, `項目ID: ${id}`);

    // 日付形式
    if (item.date && !isValidDate(item.date)) {
      addError('news.json', `日付形式が不正です (期待形式: YYYY-MM-DD): "${item.date}"`, `項目ID: ${id}`);
    }

    // 重複チェック
    if (item.id) {
      if (allIds.has(item.id)) {
        addError('news.json', `IDが重複しています: "${item.id}"`, `重複元: ${allIds.get(item.id)}`);
      } else {
        allIds.set(item.id, 'news.json');
      }
    }

    // リンク切れチェック
    if (item.url) checkUrlExists(item.url, 'news.json', id);
  });
}

// --- B. knowledge.json の検証 ---
const knowledge = loadAndValidateJSON('knowledge.json');
if (Array.isArray(knowledge)) {
  knowledge.forEach((item, idx) => {
    const id = item.id || `(インデックス ${idx})`;

    // 必須項目
    if (!item.id) addError('knowledge.json', `必須項目 'id' がありません`, `項目: ${JSON.stringify(item)}`);
    if (!item.title) addError('knowledge.json', `必須項目 'title' がありません`, `項目ID: ${id}`);
    if (!item.category) addError('knowledge.json', `必須項目 'category' がありません`, `項目ID: ${id}`);
    if (!item.url) addError('knowledge.json', `必須項目 'url' がありません`, `項目ID: ${id}`);

    // 日付形式
    if (item.date && !isValidDate(item.date)) {
      addError('knowledge.json', `日付形式が不正です (期待形式: YYYY-MM-DD): "${item.date}"`, `項目ID: ${id}`);
    }

    // 重複チェック
    if (item.id) {
      if (allIds.has(item.id)) {
        addError('knowledge.json', `IDが重複しています: "${item.id}"`, `重複元: ${allIds.get(item.id)}`);
      } else {
        allIds.set(item.id, 'knowledge.json');
      }
    }

    // リンク切れチェック
    if (item.url) checkUrlExists(item.url, 'knowledge.json', id);
  });
}

// --- C. schedule.json の検証 ---
const schedule = loadAndValidateJSON('schedule.json');
if (Array.isArray(schedule)) {
  schedule.forEach((item, idx) => {
    const id = item.id || `(インデックス ${idx})`;
    if (!item.id) addError('schedule.json', `必須項目 'id' がありません`, `項目: ${JSON.stringify(item)}`);
    if (!item.title) addError('schedule.json', `必須項目 'title' がありません`, `項目ID: ${id}`);
    if (!item.date) addError('schedule.json', `必須項目 'date' がありません`, `項目ID: ${id}`);

    if (item.id) {
      if (allIds.has(item.id)) {
        addError('schedule.json', `IDが重複しています: "${item.id}"`, `重複元: ${allIds.get(item.id)}`);
      } else {
        allIds.set(item.id, 'schedule.json');
      }
    }
  });
}

// --- D. assignments.json の検証 ---
const assignments = loadAndValidateJSON('assignments.json');
if (assignments) {
  if (Array.isArray(assignments.monthlyFocus) && Array.isArray(assignments.weeklyRoles)) {
    // リスト形式の場合
  } else if (assignments.monthlyGoal) {
    // オブジェクト形式の場合
    if (assignments.resourceLink) {
      checkUrlExists(assignments.resourceLink, 'assignments.json', 'resourceLink');
    }
  } else {
    addWarning('assignments.json', `形式が推奨フォーマットと異なります`);
  }
}

// --- E. prompts.json / resources.json / members.json の検証 ---
const prompts = loadAndValidateJSON('prompts.json');
if (Array.isArray(prompts)) {
  prompts.forEach((p, idx) => {
    const id = p.id || `prompt-${idx}`;
    if (p.id && allIds.has(p.id)) {
      addError('prompts.json', `IDが重複しています: "${p.id}"`, `重複元: ${allIds.get(p.id)}`);
    } else if (p.id) {
      allIds.set(p.id, 'prompts.json');
    }
  });
}

const resources = loadAndValidateJSON('resources.json');
if (Array.isArray(resources)) {
  resources.forEach((r, idx) => {
    if (r.url) checkUrlExists(r.url, 'resources.json', r.id || `res-${idx}`);
  });
}

// --- 結果レポートの出力 ---
console.log('----------------------------------------------------');
if (warnings.length > 0) {
  console.log(`⚠️  警告: ${warnings.length} 件`);
  warnings.forEach(w => {
    console.log(`   [${w.file}] ${w.message}`);
    if (w.details) console.log(`      └ ${w.details}`);
  });
  console.log('----------------------------------------------------');
}

if (errors.length > 0) {
  console.error(`❌ エラー検出: 合計 ${errors.length} 件の問題が見つかりました！\n`);
  errors.forEach((e, i) => {
    console.error(`  ${i + 1}. [${e.file}] ${e.message}`);
    if (e.details) console.error(`     └ ${e.details}`);
  });
  console.error('\n🚨 データの修正が必要です。ビルドを中止します。');
  console.log('----------------------------------------------------');
  process.exit(1);
} else {
  console.log('✨ すべてのデータ検証を正常にパスしました！');
  console.log(`   - 総検証アイテム数: ${allIds.size} 件`);
  console.log('   - JSON形式: 正常');
  console.log('   - 必須項目・日付形式: 正常');
  console.log('   - ID重複: なし');
  console.log('   - リンク切れ: なし');
  console.log('----------------------------------------------------');
  process.exit(0);
}
