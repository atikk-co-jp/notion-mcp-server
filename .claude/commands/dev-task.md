---
description: developブランチから新規ブランチを作成し、タスクを実行してPRを作成する
argument-hint: <タスクの説明>
allowed-tools: Bash(git:*), Bash(gh:*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# Dev Task - developブランチベースのタスク実行

## Context

このコマンドは以下のワークフローを自動化します：
1. developブランチを最新化
2. タスクに適した新規ブランチを作成
3. タスクを実行
4. developブランチ向けのPRを作成

## Task

$ARGUMENTS

## Steps

### 1. 準備フェーズ
1. 現在の作業状態を確認（未コミットの変更がないか）
2. developブランチに切り替え、最新化（`git checkout develop && git pull origin develop`）
3. タスク内容からブランチ名を生成（例: `feature/add-xxx`, `fix/xxx-bug`, `refactor/xxx`）
4. 新規ブランチを作成（`git checkout -b <branch-name>`）

### 2. 実装フェーズ
1. タスクの内容を分析し、必要な変更を特定
2. コードの変更を実装
3. 適切な単位でコミット（意味のあるコミットメッセージを使用）

### 3. PR作成フェーズ
1. ブランチをリモートにプッシュ（`git push -u origin <branch-name>`）
2. developブランチ向けにPRを作成（`gh pr create --base develop`）
3. PRのURLを報告

## Constraints

- 未コミットの変更がある場合は、作業を開始する前にユーザーに確認する
- ブランチ名は英語で、kebab-caseを使用する
- コミットメッセージは変更内容を適切に説明する
- PRのタイトルと説明は日本語で作成する
- 実装中にエラーが発生した場合は、適切に対処してから続行する
- テストがある場合は、PRを作成する前にテストが通ることを確認する

## Output

作業完了後、以下を報告：
- 作成したブランチ名
- 実施した変更の概要
- PRのURL
