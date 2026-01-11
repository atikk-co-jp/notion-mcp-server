# notion-mcp-server

[English](./README.md) | 日本語

Notion API用のMCP（Model Context Protocol）サーバー。AIアシスタントがNotionのページ、データベース、ブロックを操作できるようにします。

**APIバージョン**: 2025-09-03（最新）

## 特徴

- **ページ操作**: Notionページの作成、取得、更新、移動
- **データベース操作**: データベースの作成、取得、更新、フィルター/ソートを使ったクエリ
- **ブロック操作**: ブロックの取得、更新、削除、子要素の追加
- **検索**: ページとデータベースの横断検索
- **コメント**: コメントの作成・一覧取得
- **ユーザー**: ユーザー一覧取得、ユーザー情報取得
- **トークン効率化**: マークダウン/シンプル形式でトークン使用量を約96%削減
- **Markdown入力対応**: Markdownでコンテンツを作成・追加（入力トークン80%削減）

## API対応表

> ⭐ = Markdown入力対応（入力トークン約80%削減）
>
> 📤 = 最小レスポンス（id/urlのみ）- 出力トークン約90%削減

| カテゴリ | Notion API | MCPツール | 入力 | 出力（デフォルト） |
|---------|-----------|----------|------|-------------------|
| **ページ** | | | | |
| | [Create page](https://developers.notion.com/reference/post-page) | `create-page` 📤 | JSON | `{id, url}` |
| | | `create-page-simple` ⭐📤 | Markdown | `{id, url}` |
| | [Retrieve page](https://developers.notion.com/reference/retrieve-a-page) | `retrieve-page` | JSON | **simple**/json |
| | [Update page](https://developers.notion.com/reference/patch-page) | `update-page` 📤 | JSON | `{id, url}` |
| | [Retrieve page property](https://developers.notion.com/reference/retrieve-a-page-property-item) | `retrieve-page-property` | JSON | json |
| | [Move page](https://developers.notion.com/reference/post-page-move) | `move-page` 📤 | JSON | `{id, url}` |
| | [Archive page](https://developers.notion.com/reference/patch-page) | `archive-page` 📤 | JSON | `{id}` |
| **データベース** | | | | |
| | [Create database](https://developers.notion.com/reference/create-a-database) | `create-database` 📤 | JSON | `{id, url}` |
| | [Retrieve database](https://developers.notion.com/reference/retrieve-a-database) | `retrieve-database` | JSON | **simple**/json |
| | [Update database](https://developers.notion.com/reference/update-a-database) | `update-database` 📤 | JSON | `{id, url}` |
| | [Archive database](https://developers.notion.com/reference/update-a-database) | `archive-database` 📤 | JSON | `{id}` |
| **データソース** | | | | |
| | [Retrieve data source](https://developers.notion.com/reference/retrieve-a-data-source) | `retrieve-data-source` | JSON | **simple**/json |
| | [Query data source](https://developers.notion.com/reference/post-data-source-query) | `query-data-source` | JSON | **simple**/json |
| | [Update data source](https://developers.notion.com/reference/patch-data-source) | `update-data-source` 📤 | JSON | `{id}` |
| **ブロック** | | | | |
| | [Retrieve block](https://developers.notion.com/reference/retrieve-a-block) | `retrieve-block` | JSON | **markdown**/json |
| | [Update block](https://developers.notion.com/reference/update-a-block) | `update-block` 📤 | JSON | `{id}` |
| | | `update-block-simple` ⭐📤 | Markdown | `{id}` |
| | [Delete block](https://developers.notion.com/reference/delete-a-block) | `delete-block` 📤 | JSON | `{id}` |
| | [Retrieve block children](https://developers.notion.com/reference/get-block-children) | `get-block-children` | JSON | **markdown**/json |
| | [Append block children](https://developers.notion.com/reference/patch-block-children) | `append-block-children` 📤 | JSON | `{block_ids}` |
| | | `append-blocks-simple` ⭐📤 | Markdown | `{block_ids}` |
| **ページコンテンツ** | | | | |
| | - | `replace-page-content` ⭐📤 | Markdown | `{deleted_count, created_count}` |
| | - | `find-and-replace-in-page` ⭐📤 | Markdown | `{updated_count, updated_block_ids}` |
| **コメント** | | | | |
| | [Create comment](https://developers.notion.com/reference/create-a-comment) | `create-comment` 📤 | JSON | `{id}` |
| | | `create-comment-simple` ⭐📤 | Markdown | `{id}` |
| | [List comments](https://developers.notion.com/reference/retrieve-comments) | `list-comments` | JSON | json |
| **ユーザー** | | | | |
| | [List users](https://developers.notion.com/reference/get-users) | `list-users` | JSON | json |
| | [Retrieve user](https://developers.notion.com/reference/get-user) | `retrieve-user` | JSON | json |
| | [Retrieve bot user](https://developers.notion.com/reference/get-self) | `retrieve-bot-user` | JSON | json |
| **検索** | | | | |
| | [Search](https://developers.notion.com/reference/post-search) | `search` | JSON | **simple**/json |

## インストール

```bash
npm install @atikk-co-jp/notion-mcp-server
# または
pnpm add @atikk-co-jp/notion-mcp-server
# または
yarn add @atikk-co-jp/notion-mcp-server
```

## 使い方

### Claude Desktopで使用する

Claude Desktopの設定ファイル（macOSの場合: `~/.config/claude/claude_desktop_config.json`）に追加:

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@atikk-co-jp/notion-mcp-server"],
      "env": {
        "NOTION_TOKEN": "your-notion-integration-token"
      }
    }
  }
}
```

### Claude Codeで使用する

`.mcp.json`に追加:

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@atikk-co-jp/notion-mcp-server"],
      "env": {
        "NOTION_TOKEN": "your-notion-integration-token"
      }
    }
  }
}
```

## Notionトークンの取得方法

1. [Notion Integrations](https://www.notion.so/my-integrations)にアクセス
2. 「新しいインテグレーション」をクリック
3. 名前を入力し、ワークスペースを選択
4. 「内部インテグレーションシークレット」をコピー（`ntn_`で始まる）
5. アクセスしたいページ/データベースをインテグレーションと共有

## 利用可能なツール

### retrieve-page

ページIDでNotionページを取得します。

**パラメータ:**
- `page_id` (必須): 取得するページのID
- `format` (任意): 出力形式 - `"simple"` (デフォルト) または `"json"`
  - `simple`: トークン使用量を削減した簡略化されたプロパティ値を返す
  - `json`: Notion APIのレスポンスをそのまま返す
- `include_content` (任意): ページコンテンツをマークダウンで含める（デフォルト: true）

```json
{
  "page_id": "ページのUUID",
  "format": "simple",
  "include_content": true
}
```

### create-page

データソースに新しいページを作成します。

```json
{
  "data_source_id": "データソースのUUID",
  "properties": {
    "Name": {
      "title": [{ "text": { "content": "新しいページタイトル" } }]
    },
    "Status": {
      "status": { "name": "進行中" }
    }
  }
}
```

### create-page-simple ⭐

Markdownを使ってページを作成します。`create-page`と比較して**出力トークン約80%削減**。

**パラメータ:**
- `data_source_id` (必須): ページを作成するデータソースのID
- `title` (必須): ページタイトル（文字列）
- `content` (任意): ページ本文（Markdown形式）
- `properties` (任意): 追加のNotionプロパティ
- `icon` (任意): 絵文字アイコン（例: "🐛"）

**サポートするMarkdown記法:**
- 見出し: `# ## ###` (####以上はheading_3にフォールバック)
- リスト: `- ` または `* ` (箇条書き)、`1. ` (番号付き)
- チェックボックス: `- [ ]` / `- [x]`
- コードブロック: ` ``` ` (言語指定対応)
- 引用: `> `
- 区切り線: `---`
- 画像: `![alt](url)`
- テーブル: `| col1 | col2 |` (ヘッダーセパレーター `|---|---|` 対応)
- インライン: `**太字**`、`*イタリック*`、`~~取り消し線~~`、`` `コード` ``、`[リンク](url)`

```json
{
  "data_source_id": "データソースのUUID",
  "title": "バグレポート",
  "content": "## 再現手順\n\n1. ログイン\n2. 設定を開く\n\n## 期待動作\n\n正常に表示される",
  "properties": {
    "Status": { "status": { "name": "Open" } }
  },
  "icon": "🐛"
}
```

**トークン比較:**
| 方式 | トークン数 | 削減率 |
|------|-----------|--------|
| create-page (ブロック構造) | ~152 | - |
| create-page-simple (Markdown) | ~26 | **83%** |

### update-page

ページのプロパティ、アイコン、カバー、アーカイブ状態、ロック状態を更新します。

**パラメータ:**
- `page_id` (必須): 更新するページのID
- `properties` (任意): 更新するプロパティ
- `icon` (任意): アイコン（nullで削除）
- `cover` (任意): カバー画像（nullで削除）
- `archived` (任意): trueでアーカイブ
- `is_locked` (任意): ページをロックしてUI上での編集を防止

```json
{
  "page_id": "ページのUUID",
  "properties": {
    "Status": {
      "status": { "name": "完了" }
    }
  },
  "is_locked": true
}
```

### query-data-source

フィルターやソートを使ってデータソースをクエリします。

**パラメータ:**
- `data_source_id` (必須): クエリするデータソースのID
- `filter` (任意): フィルター条件（JSONオブジェクト）
- `sorts` (任意): ソート条件（配列）
- `start_cursor` (任意): ページネーション用カーソル
- `page_size` (任意): 返す結果の数 (1-100)
- `format` (任意): 出力形式 - `"simple"` (デフォルト) または `"json"`
  - `simple`: トークン使用量を削減した簡略化されたプロパティ値を返す
  - `json`: Notion APIのレスポンスをそのまま返す

```json
{
  "data_source_id": "データソースのUUID",
  "filter": {
    "property": "Status",
    "status": { "equals": "進行中" }
  },
  "sorts": [
    { "property": "Created", "direction": "descending" }
  ],
  "format": "simple"
}
```

### create-database

既存のページのサブページとして新しいデータベースを作成します。

**パラメータ:**
- `parent_page_id` (必須): 親ページのID
- `properties` (必須): 少なくとも1つのtitleプロパティを含むデータベーススキーマ
- `title` (任意): データベースタイトル（リッチテキスト配列）
- `icon` (任意): データベースのアイコン
- `cover` (任意): データベースのカバー画像
- `is_inline` (任意): trueの場合、インラインデータベースとして作成

```json
{
  "parent_page_id": "親ページのUUID",
  "properties": {
    "Name": { "title": {} },
    "Status": { "select": { "options": [{ "name": "未着手" }, { "name": "完了" }] } },
    "Priority": { "number": {} }
  },
  "title": [{ "type": "text", "text": { "content": "タスクデータベース" } }]
}
```

### update-database

既存のデータベースコンテナ（タイトル、説明、アイコン、カバー）を更新します。

**注意:** スキーマ（プロパティ/カラム）の更新には `update-data-source` を使用してください。

**パラメータ:**
- `database_id` (必須): 更新するデータベースのID
- `title` (任意): 新しいタイトル（リッチテキスト配列）
- `description` (任意): 新しい説明（リッチテキスト配列）
- `icon` (任意): アイコン（nullで削除）
- `cover` (任意): カバー画像（nullで削除）
- `is_inline` (任意): trueの場合、インラインデータベースとして作成
- `archived` (任意): trueでアーカイブ
- `is_locked` (任意): データベースをロックしてUI上での編集を防止

```json
{
  "database_id": "データベースのUUID",
  "title": [{ "type": "text", "text": { "content": "新しいタイトル" } }],
  "is_locked": true
}
```

### retrieve-data-source

データソーススキーマをIDで取得します。

**パラメータ:**
- `data_source_id` (必須): データソースのID
- `format` (任意): 出力形式 - `"simple"` (デフォルト) または `"json"`

```json
{
  "data_source_id": "データソースのUUID",
  "format": "simple"
}
```

### update-data-source

データソーススキーマ（プロパティ/カラム）を更新します。

**パラメータ:**
- `data_source_id` (必須): 更新するデータソースのID
- `properties` (任意): 追加、更新、削除するプロパティ（nullで削除）

```json
{
  "data_source_id": "データソースのUUID",
  "properties": {
    "NewColumn": { "rich_text": {} },
    "OldColumn": null
  }
}
```

### search

すべてのページとデータソースを横断検索します。

```json
{
  "query": "検索キーワード",
  "filter": { "value": "page", "property": "object" }
}
```

**フィルター値:** `"page"` または `"data_source"`

### get-block-children

ページまたはブロックの子ブロックを取得します。

**パラメータ:**
- `block_id` (必須): 子ブロックを取得するブロックまたはページのID
- `start_cursor` (任意): ページネーション用カーソル
- `page_size` (任意): 返す結果の数 (1-100)
- `format` (任意): 出力形式 - `"markdown"` (デフォルト) または `"json"`
  - `markdown`: トークン使用量を大幅に削減（約96%削減）した人間が読みやすいマークダウン形式
  - `json`: Notion APIのレスポンスをそのまま返す
- `fetch_nested` (任意): `format="markdown"`の時、ネストされた子ブロックを再帰的に取得する（デフォルト: false）

```json
{
  "block_id": "ページまたはブロックのUUID",
  "format": "markdown",
  "fetch_nested": true
}
```

### append-block-children

ページまたはブロックに新しいブロックを追加します。

```json
{
  "block_id": "ページまたはブロックのUUID",
  "children": [
    {
      "type": "paragraph",
      "paragraph": {
        "rich_text": [{ "text": { "content": "新しい段落" } }]
      }
    }
  ]
}
```

### append-blocks-simple ⭐

Markdownを使ってブロックを追加します。`append-block-children`と比較して**出力トークン約80%削減**。

**パラメータ:**
- `block_id` (必須): 追加先のページまたはブロックのID
- `content` (必須): 追加するコンテンツ（Markdown形式）
- `after` (任意): このブロックIDの後に挿入

`create-page-simple`と同じMarkdown記法をサポートしています。

```json
{
  "block_id": "ページまたはブロックのUUID",
  "content": "# 新しいセクション\n\nこれは**重要な**コンテンツで[リンク](https://example.com)もあります。\n\n- 項目1\n- 項目2\n\n```javascript\nconst x = 1;\n```"
}
```

**トークン比較:**
| 方式 | トークン数 | 削減率 |
|------|-----------|--------|
| append-block-children (ブロック構造) | ~201 | - |
| append-blocks-simple (Markdown) | ~42 | **79%** |

### create-comment

ページにコメントを追加します。

```json
{
  "page_id": "ページのUUID",
  "rich_text": [{ "type": "text", "text": { "content": "これはコメントです" } }]
}
```

### replace-page-content ⭐

ページの全コンテンツをMarkdownで置換します。`child_database`と`child_page`ブロックは自動的に保護されます（削除されません）。

**パラメータ:**
- `page_id` (必須): 更新するページのID
- `content` (必須): 新しいコンテンツ（Markdown形式）
- `dry_run` (任意): 削除されるブロックをプレビュー（実際には変更しない）（デフォルト: false）

**⚠️ 注意:** Markdownで表現できないブロック（bookmark, callout, equation, table_of_contents, synced_block等）は**削除されます**。実行前に `dry_run: true` でプレビューを確認してください。

**サポートするMarkdown記法:**
見出し(#)、リスト(- または 1.)、チェックボックス(- [ ])、コードブロック(```)、引用(>)、テーブル(| |)、画像(![]())、太字(**)、イタリック(*)、リンク([]())

```json
{
  "page_id": "ページのUUID",
  "content": "# 新しいタイトル\n\nこれは完全に新しいコンテンツです。\n\n## セクション1\n\n- 項目1\n- 項目2"
}
```

**削除プレビュー (dry run):**
```json
{
  "page_id": "ページのUUID",
  "content": "# 新しいコンテンツ",
  "dry_run": true
}
```

**使い分け:**
- ページ全体を書き換えたい場合 → `replace-page-content`
- 特定のテキストだけ置換したい場合 → `find-and-replace-in-page`
- 単一ブロックを更新したい（block_idがわかる）場合 → `update-block-simple`

### find-and-replace-in-page ⭐

ページ内のテキストを検索して置換します。正規表現にも対応。

**パラメータ:**
- `page_id` (必須): 対象ページのID
- `find` (必須): 検索文字列（`use_regex: true`の場合は正規表現パターン）
- `replace` (必須): 置換テキスト（Markdown対応: **太字**, *イタリック*, [リンク](url)など）
- `use_regex` (任意): trueの場合、`find`を正規表現として解釈（デフォルト: false）

```json
{
  "page_id": "ページのUUID",
  "find": "古いテキスト",
  "replace": "**新しいテキスト**"
}
```

**正規表現の例:**
```json
{
  "page_id": "ページのUUID",
  "find": "item\\d+",
  "replace": "アイテム",
  "use_regex": true
}
```

**対象ブロックタイプ:** paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, to_do, quote, callout, toggle

## 開発

```bash
# 依存関係のインストール
pnpm install

# 開発モードで実行
pnpm dev

# 本番用ビルド
pnpm build

# 型チェック
pnpm typecheck

# リント
pnpm lint

# コードフォーマット
pnpm format

# テスト実行
pnpm test

# ウォッチモードでテスト実行
pnpm test:watch
```

## ライセンス

MIT
