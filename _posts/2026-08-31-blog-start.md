---
title: 블로그 시작
date: 2026-08-31 10:00:00 +0900
categories: [Blog]
tags: [jekyll, chirpy]
---

Jekyll + Chirpy 테마로 블로그를 열었습니다. 이 글은 글 쓰는 방식을 잊지 않으려고 남겨두는 메모입니다.

## 글 쓰는 법

`_posts` 폴더에 `YYYY-MM-DD-제목.md` 형식으로 파일을 만들면 됩니다. 파일 이름의 날짜가 발행일이 되므로 형식을 지켜야 합니다.

파일 맨 위에는 front matter가 들어갑니다.

```yaml
---
title: 글 제목
date: 2026-08-31 10:00:00 +0900
categories: [상위분류, 하위분류]
tags: [태그1, 태그2]
---
```

- `categories`는 최대 2단계까지 쓸 수 있습니다.
- `tags`는 개수 제한이 없고, 소문자로 쓰는 것이 관례입니다.
- 아직 공개하고 싶지 않으면 `published: false`를 추가하면 빌드에서 제외됩니다.

## 자주 쓰는 문법

코드 블록은 언어를 지정하면 하이라이팅이 됩니다.

```python
def hello(name: str) -> str:
    return f"안녕하세요, {name}"
```

Chirpy는 강조 상자를 지원합니다.

> 참고할 내용을 적습니다.
{: .prompt-tip }

> 주의할 내용을 적습니다.
{: .prompt-warning }

이미지는 `assets/img/` 아래에 넣고 이렇게 참조합니다.

```markdown
![설명](/assets/img/example.png)
_이미지 아래 설명_
```

## 남은 작업

- [ ] 배포 방식 결정 (GitHub Pages / Cloudflare Pages)
- [ ] 프로필 이미지 추가
- [ ] About 페이지 채우기
