import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 簡易CSVパーサー（ダブルクォートやカンマ・改行に対応）
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // ignore CR
      } else if (char === '\n') {
        row.push(currentField.trim());
        if (row.length > 0 && row.some(col => col !== '')) {
          lines.push(row);
        }
        row = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || row.length > 0) {
    row.push(currentField.trim());
    if (row.some(col => col !== '')) {
      lines.push(row);
    }
  }

  if (lines.length === 0) return [];

  const headers = lines[0].map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const record = {};
    for (let j = 0; j < headers.length; j++) {
      const val = lines[i][j] || '';
      record[headers[j]] = val;
    }
    records.push(record);
  }

  return records;
}

// 真偽値変換
function parseBoolean(val) {
  if (!val) return false;
  const str = String(val).trim().toLowerCase();
  return str === 'true' || str === '1' || str === 'yes' || str === 'はい';
}

async function syncSheets() {
  const configPath = path.join(rootDir, 'config', 'sheets.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.warn('⚠️ config/sheets.json の読み込みに失敗しました:', e.message);
    }
  }

  const spreadsheetId = process.env.SPREADSHEET_ID || config.spreadsheetId;

  if (!spreadsheetId && !config.csvUrls?.news) {
    console.log('ℹ️ スプレッドシートIDまたはURLが設定されていません。既存の data/*.json を保持します。');
    return;
  }

  console.log('🔄 Googleスプレッドシートからデータを取得・同期中...');

  // 1. お知らせ (news)
  try {
    const url = config.csvUrls?.news || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=news`;
    const res = await fetch(url);
    if (res.ok) {
      const csvText = await res.text();
      const records = parseCSV(csvText);
      const newsData = records
        .filter(r => r.title)
        .map((r, idx) => ({
          id: r.id || `news-${r.date?.replace(/-/g, '') || idx}`,
          date: r.date || new Date().toISOString().split('T')[0],
          type: r.type || 'UPDATE',
          typeLabel: r.typeLabel || r.type || 'UPDATE',
          badgeClass: r.badgeClass || (r.type === 'EVENT' ? 'badge-event' : 'badge-update'),
          title: r.title,
          url: r.url || 'knowledge.html',
          isNew: parseBoolean(r.isNew)
        }));

      if (newsData.length > 0) {
        fs.writeFileSync(path.join(rootDir, 'data', 'news.json'), JSON.stringify(newsData, null, 2), 'utf-8');
        console.log(`✅ data/news.json を更新しました (${newsData.length} 件)`);
      }
    }
  } catch (err) {
    console.warn('⚠️ news シートの同期をスキップしました:', err.message);
  }

  // 2. スケジュール (schedule)
  try {
    const url = config.csvUrls?.schedule || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=schedule`;
    const res = await fetch(url);
    if (res.ok) {
      const csvText = await res.text();
      const records = parseCSV(csvText);
      const scheduleData = records
        .filter(r => r.title)
        .map((r, idx) => ({
          id: r.id || `sch-${idx}`,
          date: r.date,
          day: r.day || '',
          time: r.time || '',
          title: r.title,
          type: r.type || 'LIVE',
          badgeClass: r.badgeClass || 'badge-live',
          isLive: parseBoolean(r.isLive),
          description: r.description || ''
        }));

      if (scheduleData.length > 0) {
        fs.writeFileSync(path.join(rootDir, 'data', 'schedule.json'), JSON.stringify(scheduleData, null, 2), 'utf-8');
        console.log(`✅ data/schedule.json を更新しました (${scheduleData.length} 件)`);
      }
    }
  } catch (err) {
    console.warn('⚠️ schedule シートの同期をスキップしました:', err.message);
  }

  // 3. 今月の目標・今週の担当 (assignments)
  try {
    const url = config.csvUrls?.assignments || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=assignments`;
    const res = await fetch(url);
    if (res.ok) {
      const csvText = await res.text();
      const records = parseCSV(csvText);
      const monthlyFocus = [];
      const weeklyRoles = [];

      records.forEach(r => {
        const cat = (r.category || '').toLowerCase();
        const text = r.item || r.text || r.title;
        if (!text) return;

        if (cat.includes('target') || cat.includes('focus') || cat.includes('目標')) {
          monthlyFocus.push(text);
        } else if (cat.includes('role') || cat.includes('担当') || cat.includes('week')) {
          weeklyRoles.push(text);
        } else {
          monthlyFocus.push(text);
        }
      });

      const assignmentsData = { monthlyFocus, weeklyRoles };
      fs.writeFileSync(path.join(rootDir, 'data', 'assignments.json'), JSON.stringify(assignmentsData, null, 2), 'utf-8');
      console.log(`✅ data/assignments.json を更新しました (目標: ${monthlyFocus.length} 件, 担当: ${weeklyRoles.length} 件)`);
    }
  } catch (err) {
    console.warn('⚠️ assignments シートの同期をスキップしました:', err.message);
  }

  // 4. ノウハウ一覧 (knowledge)
  try {
    const url = config.csvUrls?.knowledge || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=knowledge`;
    const res = await fetch(url);
    if (res.ok) {
      const csvText = await res.text();
      const records = parseCSV(csvText);
      const knowledgeData = records
        .filter(r => r.title)
        .map((r, idx) => {
          const tags = r.tags ? r.tags.split(/[,、]/).map(t => t.trim()).filter(Boolean) : [];
          return {
            id: r.id || `knowledge-sheet-${idx}`,
            date: r.date || new Date().toISOString().split('T')[0],
            displayDate: r.displayDate || `${(r.date || '').slice(5, 7)}月${(r.date || '').slice(8, 10)}日追加`,
            category: r.category || '運用ノウハウ',
            badgeClass: r.badgeClass || 'badge-blue',
            title: r.title,
            excerpt: r.excerpt || '',
            url: r.url || `guides/${r.id || `guide-${idx}`}.html`,
            tags: tags,
            isNew: parseBoolean(r.isNew),
            content: r.content || '',
            author: r.author || ''
          };
        });

      if (knowledgeData.length > 0) {
        fs.writeFileSync(path.join(rootDir, 'data', 'knowledge.json'), JSON.stringify(knowledgeData, null, 2), 'utf-8');
        console.log(`✅ data/knowledge.json を更新しました (${knowledgeData.length} 件)`);
      }
    }
  } catch (err) {
    console.warn('⚠️ knowledge シートの同期をスキップしました:', err.message);
  }

  console.log('🎉 スプレッドシート同期処理が完了しました。');
}

syncSheets();
