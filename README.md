# groovallstar.github.io

Jekyll 로 만든 개인 블로그. 레이아웃은 [lilianweng.github.io](https://lilianweng.github.io/) 와 같은
PaperMod 계열 구성을 직접 구현했다 (테마 젬 없이 `_layouts` / `_includes` / `assets` 로 관리).

## 로컬 실행

```console
$ bundle install
$ bundle exec jekyll serve --livereload
```

http://localhost:4000 에서 확인할 수 있다.

## 글 쓰기

`_posts/YYYY-MM-DD-제목.md` 로 파일을 만들고 front matter 를 채운다.

```yaml
---
title: 글 제목
date: 2026-08-31 10:00:00 +0900
categories: [상위분류, 하위분류]
tags: [태그1, 태그2]
---
```

- `description` 을 넣으면 목록의 요약문으로 쓰인다. 없으면 첫 문단이 쓰인다.
- `toc: false` 를 넣으면 그 글에서 목차를 감춘다.

## 구조

| 경로 | 역할 |
| --- | --- |
| `_layouts/` | 페이지 레이아웃 (home, post, archives, terms 등) |
| `_includes/` | head, 헤더 내비게이션, 글 목록 카드 |
| `assets/css/main.scss` | 전체 스타일 (라이트/다크 토큰, Rouge 하이라이트) |
| `assets/js/main.js` | 테마 토글, 목차 생성, 맨 위로 |
| `_config.yml` | 사이트 정보, 내비게이션(`nav`), 홈 인사말(`home_info`) |

## 배포

`main` 에 푸시하면 GitHub Actions 가 빌드해 GitHub Pages 로 배포한다.
