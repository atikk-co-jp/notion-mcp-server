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
4. package.jsonから現在のバージョンを取得

### 2. バージョン・CHANGELOG確認
1. PRの変更内容を確認し、適切なバージョン番号を決定（semver準拠）
   - 破壊的変更: メジャーバージョンを上げる
   - 機能追加: マイナーバージョンを上げる
   - バグ修正・ドキュメント: パッチバージョンを上げる
2. package.jsonのバージョンが更新されているか確認
3. CHANGELOG.mdに該当バージョンの記載があるか確認
4. 不足がある場合は、PRブランチに以下を追加コミット：
   - package.jsonのバージョン更新
   - CHANGELOG.mdの該当バージョンセクション追加（**必ず英語で記載**）
   ```bash
   # PRブランチをチェックアウト
   gh pr checkout $1

   # バージョン更新（必要な場合）
   npm version <patch|minor|major> --no-git-tag-version

   # CHANGELOG.md更新（必要な場合）
   # 形式例:
   # ## [0.x.x] - YYYY-MM-DD
   # ### Added
   # - New feature description
   # ### Fixed
   # - Bug fix description

   # コミットしてプッシュ
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to <version>"
   git push
   ```
5. CIが再度通ることを確認

### 3. PRマージ（develop向け）
1. PRをマージ（`gh pr merge $1 --squash`）
2. ローカルのdevelopを最新化（`git checkout develop && git pull origin develop`）

### 4. リリースPR作成（develop → main）
1. mainブランチを最新化（`git fetch origin main`）
2. develop → main向けのPRを作成
   ```
   gh pr create --base main --head develop --title "Release v<version>" --body "## Changes\n\n<develop→mainの差分サマリー>"
   ```
3. PRのCIが通るのを待機

### 5. リリースPRマージ
1. CIが通ったらPRをマージ（`gh pr merge <pr-number> --merge`）
2. ローカルのmainを最新化

### 6. リリースタグ作成
1. package.jsonのバージョンを確認
2. GitHub Releaseを作成（これがpublish.ymlをトリガー）
   ```
   gh release create v<version> --target main --title "v<version>" --notes "<リリースノート>"
   ```

### 7. GitHub Actions監視
1. publish.ymlワークフローの実行を確認（`gh run list --workflow=publish.yml --limit=1`）
2. ワークフローの完了を待機（`gh run watch <run-id>`）
3. 成功を確認

## Constraints

- PRがdevelop向けでない場合はエラーで中止
- CIが失敗している場合はマージしない
- タグバージョンはpackage.jsonのバージョンと一致させる（publish.ymlの検証に必要）
- package.jsonのバージョンが更新されていない場合は、PRマージ前に必ず更新する
- CHANGELOG.mdに該当バージョンの記載がない場合は、PRマージ前に必ず追加する
- CHANGELOG.mdは必ず英語で記載する（日本語は不可）
- リリースノートはCHANGELOG.mdの該当バージョンの内容を使用する
- mainへのマージは`--merge`（squashではない）を使用してコミット履歴を保持
- GitHub Actionsが失敗した場合は原因を報告

## Output

リリース完了後、以下を報告：
- マージしたPR
- 作成したリリースPR
- リリースタグ（例: v0.7.1）
- npm公開結果（成功/失敗）
- npmパッケージURL: https://www.npmjs.com/package/@anthropic-ai/notion-mcp-server
