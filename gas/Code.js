/**
 * Instagram サークルダッシュボード
 * Google スプレッドシート ➔ GitHub Actions 自動連携スクリプト
 */

// ==========================================
// 設定項目（プロパティサービスまたはここに直接入力）
// ==========================================
const GITHUB_CONFIG = {
  OWNER: 'shuhei1007',          // GitHub ユーザー名 / 組織名
  REPO: 'task-force',           // GitHub リポジトリ名
  WORKFLOW_ID: 'deploy.yml',    // ワークフローファイル名
  REF: 'main'                   // 対象ブランチ
};

/**
 * スプレッドシートを開いた時に専用メニューを追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 ダッシュボード連携')
    .addItem('サイトを即時更新・デプロイ', 'triggerGitHubDeploy')
    .addSeparator()
    .addItem('連携設定（PATトークン登録）', 'showTokenPrompt')
    .addToUi();
}

/**
 * GitHub Actions (workflow_dispatch) をトリガーしてサイトを更新
 */
function triggerGitHubDeploy() {
  const ui = SpreadsheetApp.getUi();
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_PAT');

  if (!token) {
    ui.alert(
      '⚠️ GitHub Personal Access Token (PAT) が未設定です',
      'メニューの「連携設定」から GitHub のトークンを登録してください。',
      ui.ButtonSet.OK
    );
    return;
  }

  const url = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/actions/workflows/${GITHUB_CONFIG.WORKFLOW_ID}/dispatches`;

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    contentType: 'application/json',
    payload: JSON.stringify({
      ref: GITHUB_CONFIG.REF
    }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();

    if (code === 204) {
      ui.alert(
        '✅ 更新リクエストを送信しました！',
        'GitHub Actions が起動しました。\n約1〜2分で最新の変更がサイト（GitHub Pages）に反映されます。',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '❌ 更新エラー',
        `GitHub API からエラーが返されました (Status: ${code}):\n${response.getContentText()}`,
        ui.ButtonSet.OK
      );
    }
  } catch (err) {
    ui.alert('❌ 送信失敗', `通信エラーが発生しました: ${err.message}`, ui.ButtonSet.OK);
  }
}

/**
 * トークン登録用ダイアログ
 */
function showTokenPrompt() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'GitHub Personal Access Token (PAT) の設定',
    'GitHub で発行したトークン（repo / actions 権限付き）を入力してください:',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() === ui.Button.OK) {
    const token = result.getResponseText().trim();
    if (token) {
      PropertiesService.getScriptProperties().setProperty('GITHUB_PAT', token);
      ui.alert('✅ トークンを安全に保存しました！');
    }
  }
}
