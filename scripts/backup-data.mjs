import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const backupsDir = path.join(rootDir, 'backups');

const MAX_BACKUPS = 10; // 保持する最大世代数

function formatTimestamp(d) {
  const pad = n => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const min = pad(d.getMinutes());
  const sec = pad(d.getSeconds());
  return `${year}${month}${day}_${hours}${min}${sec}`;
}

function backupData() {
  if (!fs.existsSync(dataDir)) {
    console.log('⚠️ data ディレクトリが存在しません。バックアップをスキップします。');
    return;
  }

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = formatTimestamp(new Date());
  const targetBackupDir = path.join(backupsDir, `data_${timestamp}`);
  fs.mkdirSync(targetBackupDir, { recursive: true });

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  let copiedCount = 0;

  files.forEach(file => {
    const src = path.join(dataDir, file);
    const dest = path.join(targetBackupDir, file);
    fs.copyFileSync(src, dest);
    copiedCount++;
  });

  console.log(`📦 [バックアップ完了] ${copiedCount} 個のデータファイルを保存しました: backups/data_${timestamp}`);

  // 古いバックアップのクリーンアップ（最新 MAX_BACKUPS 世代を残す）
  const allBackups = fs.readdirSync(backupsDir)
    .filter(d => d.startsWith('data_'))
    .sort();

  if (allBackups.length > MAX_BACKUPS) {
    const toDelete = allBackups.slice(0, allBackups.length - MAX_BACKUPS);
    toDelete.forEach(dirName => {
      const delPath = path.join(backupsDir, dirName);
      fs.rmSync(delPath, { recursive: true, force: true });
      console.log(`🧹 古いバックアップを削除しました: backups/${dirName}`);
    });
  }
}

backupData();
