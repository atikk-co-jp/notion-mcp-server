---
description: PRマージからnpm公開までの完全なリリースフローを実行
argument-hint: <PR番号>
allowed-tools: Bash(git:*), Bash(gh:*), Read(*), Glob(*)
---

# npm Release - 完全なリリースフロー

## Context

このコマンドは以下のリリースワークフローを自動化します：
1. 指定されたPRをdevelopにマージ
2. develop → main向けのリリースPRを作成・マージ
3. リリースタグを作成してpublish.ymlをトリガー
4. GitHub Actionsの完了を監視

リリースワークフロー: @.github/workflows/publish.yml

## Task

PR #$1 をリリースする

## Steps

### 1. 事前確認
1. 指定されたPR（#$1）の状態を確認（`gh pr view $1`）
2. PRがdevelopブランチ向けであることを確認
3. CIが通っていることを確認
4. package.jsonからバージョンを取得

### 2. PRマージ（develop向け）
1. PRをマージ（`gh pr merge $1 --squash`）
2. ローカルのdevelopを最新化（`git checkout develop && git pull origin develop`）

### 3. リリースPR作成（develop → main）
1. mainブランチを最新化（`git fetch origin main`）
2. develop → main向けのPRを作成
   ```
   gh pr create --base main --head develop --title "Release v<version>" --body "## Changes\n\n<develop→mainの差分サマリー>"
   ```
3. PRのCIが通るのを待機

### 4. リリースPRマージ
1. CIが通ったらPRをマージ（`gh pr merge <pr-number> --merge`）
2. ローカルのmainを最新化

### 5. リリースタグ作成
1. package.jsonのバージョンを確認
2. GitHub Releaseを作成（これがpublish.ymlをトリガー）
   ```
   gh release create v<version> --target main --title "v<version>" --notes "<リリースノート>"
   ```

### 6. GitHub Actions監視
1. publish.ymlワークフローの実行を確認（`gh run list --workflow=publish.yml --limit=1`）
2. ワークフローの完了を待機（`gh run watch <run-id>`）
3. 成功を確認

## Constraints

- PRがdevelop向けでない場合はエラーで中止
- CIが失敗している場合はマージしない
- タグバージョンはpackage.jsonのバージョンと一致させる（publish.ymlの検証に必要）
- リリースノートはCHANGELOG.mdがあれば該当バージョンの内容を使用
- mainへのマージは`--merge`（squashではない）を使用してコミット履歴を保持
- GitHub Actionsが失敗した場合は原因を報告

## Output

リリース完了後、以下を報告：
- マージしたPR
- 作成したリリースPR
- リリースタグ（例: v0.7.1）
- npm公開結果（成功/失敗）
- npmパッケージURL: https://www.npmjs.com/package/@anthropic-ai/notion-mcp-server
