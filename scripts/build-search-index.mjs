import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const entries = [];

const entityMap = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#x27': "'"
};

function decode(value) {
    return String(value || '')
        .replace(/&([^;]+);/g, (match, entity) => entityMap[entity] ?? match)
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function text(value) {
    return decode(String(value || '')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' '))
        .replace(/\s+/g, ' ')
        .trim();
}

function excerpt(value, length = 150) {
    const clean = text(value);
    return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function topicTags(value) {
    const source = text(value);
    const rules = [
        ['初心者向け', /初級|初心者|基礎/], ['リール', /リール|ショート動画/], ['フィード', /フィード/],
        ['競合分析', /競合|リサーチ/], ['アカウント設計', /アカウント設計|コンセプト|プロフィール/],
        ['マネタイズ', /マネタイズ|収益|PR|アフィリエイト|楽天|運用代行/], ['撮影', /撮影|カメラ|機材/],
        ['法律', /法律|法務|著作権|薬機法/], ['ライティング', /ライティング|文章|台本|キャプション/],
        ['ストーリーズ', /ストーリーズ/], ['デザイン', /デザイン|サムネイル|世界観/]
    ];
    return rules.filter(([, pattern]) => pattern.test(source)).map(([tag]) => tag);
}

async function load(file) {
    return readFile(join(root, file), 'utf8');
}

function add(entry) {
    entries.push({
        id: `${entry.type}-${entries.length + 1}`,
        type: entry.type,
        title: text(entry.title),
        excerpt: excerpt(entry.excerpt),
        url: entry.url,
        tags: unique((entry.tags || []).map(text)),
        updated: entry.updated || '2026-08-25',
        keywords: text(entry.keywords || '').slice(0, 5000)
    });
}

async function addCards(file, type, dates = {}) {
    const html = await load(file);
    const cardPattern = /<div class="card gs-item">([\s\S]*?)<\/div>\s*<\/div>/g;
    for (const match of html.matchAll(cardPattern)) {
        const block = match[1];
        const href = block.match(/<a[^>]+href="([^"]+)"[^>]*class="card-link"/)?.[1];
        const title = block.match(/<h3[^>]*class="[^"]*card-title[^"]*"[^>]*>([\s\S]*?)<\/h3>/)?.[1];
        if (!href || !title) continue;
        const category = block.match(/<span[^>]*class="[^"]*category[^"]*"[^>]*>([\s\S]*?)<\/span>/)?.[1] || '';
        const description = block.match(/<p[^>]*class="card-excerpt"[^>]*>([\s\S]*?)<\/p>/)?.[1] || '';
        const cleanHref = href.split('?')[0];
        add({
            type,
            title,
            excerpt: description,
            url: href,
            tags: [category, ...topicTags(`${title} ${description} ${category}`)],
            updated: dates[cleanHref] || '2026-08-25',
            keywords: `${title} ${description} ${category}`
        });
    }
}

let knowledgeDateMap = {
    'info_2026_07.html': '2026-07-31',
    'info_2026_08.html': '2026-08-21',
    'info_2026_09.html': '2026-09-19',
    'guides/youtube-reels-5tips.html': '2026-09-16',
    'guides/worldview-guide.html': '2026-09-07',
    'guides/comment-dm-automation.html': '2026-09-07'
};

try {
    const rawKnowledge = await load('data/knowledge.json');
    const parsedKnowledge = JSON.parse(rawKnowledge);
    if (Array.isArray(parsedKnowledge)) {
        parsedKnowledge.forEach(k => {
            if (k.url && k.date) {
                knowledgeDateMap[k.url.split('?')[0]] = k.date;
            }
        });
    }
} catch (_e) {}

await addCards('knowledge.html', 'knowledge', knowledgeDateMap);

const promptHtml = await load('prompts.html');
for (const match of promptHtml.matchAll(/<section class="prompt-section[^\"]*"[^>]*>([\s\S]*?)<\/section>/g)) {
    const block = match[1];
    const title = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1];
    const promptId = block.match(/<pre[^>]+id="([^"]+)"/)?.[1];
    const promptText = block.match(/<pre[^>]*>([\s\S]*?)<\/pre>/)?.[1] || '';
    if (!title || !promptId) continue;
    add({
        type: 'prompt', title, excerpt: promptText, url: `prompts.html#${promptId}`,
        tags: topicTags(`${title} ${promptText}`), updated: '2026-08-25', keywords: promptText
    });
}

for (const [file, month] of [['radio_2026_08.html', '08'], ['radio_2026_09.html', '09']]) {
    const html = await load(file);
    for (const match of html.matchAll(/<details class="radio-day[^\"]*"[^>]*>([\s\S]*?)<\/details>/g)) {
        const block = match[1];
        const heading = block.match(/<h2[^>]*class="radio-day-title"[^>]*>([\s\S]*?)<\/h2>/)?.[1];
        const day = text(block.match(/<span[^>]*class="radio-day-meta"[^>]*>([\s\S]*?)<\/span>/)?.[1]).split('/')[1];
        if (!heading || !day) continue;
        const title = text(heading).replace(/^\d{1,2}\/\d{1,2}/, '').trim();
        const date = `2026-${month}-${String(day).padStart(2, '0')}`;
        add({
            type: 'radio', title, excerpt: block, url: `${file}#radio-${date}`,
            tags: topicTags(block), updated: date, keywords: block
        });
    }
}

await addCards('live.html', 'live', {
    'live_kyon_buzz_reels.html': '2026-09-21',
    'live_miko_miu_buzz_reels.html': '2026-09-17',
    'live_meetup_2026_09_nagoya.html': '2026-09-16',
    'live_review_2026_09.html': '2026-09-07',
    'live_kai9_exchange.html': '2026-09-07',
    'info_2026_09.html': '2026-09-01'
});

const memberHtml = await load('members.html');
const memberMatches = [...memberHtml.matchAll(/<h2 class="profile-name">([\s\S]*?)<\/h2>/g)];
memberMatches.forEach((match, index) => {
    const start = match.index;
    const end = memberMatches[index + 1]?.index || memberHtml.length;
    const block = memberHtml.slice(start, end);
    add({
        type: 'member', title: match[1], excerpt: block, url: `members.html#member-${index + 1}`,
        tags: ['メンバー', ...topicTags(block)], updated: '2026-09-07', keywords: block
    });
});

entries.sort((a, b) => String(b.updated).localeCompare(String(a.updated)) || a.title.localeCompare(b.title, 'ja'));
await mkdir(join(root, 'data'), { recursive: true });
await writeFile(join(root, 'data', 'search-index.json'), `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
console.log(`Generated ${entries.length} search entries.`);
