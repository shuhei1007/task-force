import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// テキスト・簡易マークダウンをHTMLに変換
function formatContentToHTML(content) {
  if (!content) return '<p>詳細は現在準備中です。</p>';

  // 段落・見出し・箇条書きの変換
  const lines = content.split('\n');
  const htmlParts = [];
  let inList = false;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (line.startsWith('### ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h3>${line.replace('### ', '')}</h3>`);
    } else if (line.startsWith('## ')) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h2>${line.replace('## ', '')}</h2>`);
    } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('・')) {
      if (!inList) {
        htmlParts.push('<ul>');
        inList = true;
      }
      const itemText = line.replace(/^[-*・]\s*/, '');
      htmlParts.push(`<li>${itemText}</li>`);
    } else {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<p>${line}</p>`);
    }
  }

  if (inList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('\n');
}

function generateHTML(item) {
  const authorInfo = item.author ? `登壇・解説：${item.author} ｜ ` : '';
  const bodyHTML = formatContentToHTML(item.content);

  return `<!DOCTYPE html>
<html lang="ja">

<head>
    <!-- cSpell:ignore InstaCircle Fw TikTok -->
    <meta charset="UTF-8">
    <link rel="icon" type="image/png" href="../assets/images/強化チームロゴ.png">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${item.title} | Instagram Circle Dashboard</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Shippori+Mincho:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/style.css?v=2026091602">
</head>

<body>
    <header class="topbar">
        <button class="menu-toggle" id="menu-toggle" aria-label="メニューを開く">
            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        </button>
        <a href="../index.html" class="logo">
            <img src="../assets/images/強化チームロゴ.png" alt="強化チームロゴ" width="120" height="80">
        </a>
    </header>

    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <aside class="sidebar" id="sidebar">
        <nav class="menu">
            <button class="accordion-btn">
                <span>メインメニュー</span>
                <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="accordion-content">
                <a href="../news.html" class="menu-item" data-page="news">お知らせ</a>
                <a href="../knowledge.html" class="menu-item active" data-page="knowledge">ノウハウ一覧</a>
                <a href="../members.html" class="menu-item" data-page="members">メンバー一覧</a>
                <a href="../prompts.html" class="menu-item" data-page="prompts">プロンプト集</a>
                <a href="../radio.html" class="menu-item" data-page="radio">ラジオ集</a>
                <a href="../live.html" class="menu-item" data-page="live">ライブ集</a>
            </div>

            <button class="accordion-btn">
                <span>その他</span>
                <svg class="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="accordion-content">
                <a href="../resources.html" class="menu-item" data-page="resources">リソース</a>
                <a href="../schedule.html" class="menu-item" data-page="schedule">スケジュール</a>
                <a href="../links.html" class="menu-item" data-page="links">関連リンク</a>
            </div>
        </nav>
    </aside>

    <main class="main-content" id="app">
        <div class="article-container gs-reveal">
            <a href="../knowledge.html" class="back-link">← ノウハウ一覧に戻る</a>

            <header class="article-header">
                <div class="article-badge-wrap" style="margin-bottom: 8px;">
                    <span class="category badge-custom ${item.badgeClass || 'badge-blue'}">${item.category || 'ノウハウ'}</span>
                </div>
                <h1>${item.title}</h1>
                <div class="article-meta">${authorInfo}更新日：${item.date || '2026-09-16'}</div>
            </header>

            <div class="article-content gs-item">
                <div class="highlight-box highlight-box--key">
                    <h2>💡 要約・ポイント</h2>
                    <p style="margin-bottom: 0;">${item.excerpt || ''}</p>
                </div>

                <div class="article-body-custom" style="margin-top: 24px;">
                    ${bodyHTML}
                </div>

                <div class="article-footer-nav" style="margin-top: 40px; text-align: center;">
                    <a href="../knowledge.html" class="btn btn-primary" style="display: inline-block; padding: 10px 24px; text-decoration: none; border-radius: 8px;">ノウハウ一覧へ戻る</a>
                </div>
            </div>
        </div>
    </main>

    <footer class="footer">
        <p>&copy; 2026 Instagram Circle Dashboard. All rights reserved.</p>
    </footer>

    <script src="../js/common.js"></script>
</body>

</html>
`;
}

function generateGuides() {
  const knowledgePath = path.join(rootDir, 'data', 'knowledge.json');
  if (!fs.existsSync(knowledgePath)) return;

  const items = JSON.parse(fs.readFileSync(knowledgePath, 'utf-8'));
  const guidesDir = path.join(rootDir, 'guides');
  if (!fs.existsSync(guidesDir)) {
    fs.mkdirSync(guidesDir, { recursive: true });
  }

  let generatedCount = 0;

  items.forEach(item => {
    if (!item.url || !item.url.startsWith('guides/')) return;
    const targetFile = path.join(rootDir, item.url);

    // まだファイルが存在しない場合、または content が明示されている場合に生成
    if (!fs.existsSync(targetFile) && item.content) {
      const html = generateHTML(item);
      fs.writeFileSync(targetFile, html, 'utf-8');
      console.log(`📄 新規詳細ページを自動生成しました: ${item.url}`);
      generatedCount++;
    }
  });

  if (generatedCount > 0) {
    console.log(`✨ 合計 ${generatedCount} 件のノウハウ詳細ページを自動生成しました。`);
  } else {
    console.log('ℹ️ 生成対象の新規ノウハウ詳細ページはありませんでした。');
  }
}

generateGuides();
