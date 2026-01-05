# notion-mcp-server

[English](./README.md) | 日本語

Notion API用のMCP（Model Context Protocol）サーバー。AIアシスタントがNotionのページ、データベース、ブロックを操作できるようにします。

> ⚠️ **注意**: これは初期リリースです。APIは変更される可能性があります。

## 特徴

- **ページ操作**: Notionページの作成、取得、更新
- **データベースクエリ**: フィルターやソートを使ったデータベース検索
- **ブロック操作**: ブロックの子要素の取得と追加
- **検索**: ページとデータベースの横断検索
- **コメント**: ページへのコメント追加

## インストール

```bash
npm install notion-mcp-server
# または
pnpm add notion-mcp-server
# または
yarn add notion-mcp-server
```

## 使い方

### Claude Desktopで使用する

Claude Desktopの設定ファイル（macOSの場合: `~/.config/claude/claude_desktop_config.json`）に追加:

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["notion-mcp-server"],
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
      "args": ["notion-mcp-server"],
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

```json
{
  "page_id": "ページのUUID"
}
```

### create-page

データベースに新しいページを作成します。

```json
{
  "database_id": "データベースのUUID",
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

### update-page

ページのプロパティを更新します。

```json
{
  "page_id": "ページのUUID",
  "properties": {
    "Status": {
      "status": { "name": "完了" }
    }
  }
}
```

### query-database

フィルターやソートを使ってデータベースをクエリします。

```json
{
  "database_id": "データベースのUUID",
  "filter": {
    "property": "Status",
    "status": { "equals": "進行中" }
  },
  "sorts": [
    { "property": "Created", "direction": "descending" }
  ]
}
```

### search

すべてのページとデータベースを横断検索します。

```json
{
  "query": "検索キーワード",
  "filter": { "value": "page", "property": "object" }
}
```

### get-block-children

ページまたはブロックの子ブロックを取得します。

```json
{
  "block_id": "ページまたはブロックのUUID"
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

### create-comment

ページにコメントを追加します。

```json
{
  "page_id": "ページのUUID",
  "rich_text": [{ "type": "text", "text": { "content": "これはコメントです" } }]
}
```

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
```

## ライセンス

MIT
