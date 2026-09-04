# SCC Archive

Soft Coding Club의 인터랙티브 작업을 한 주소에서 탐색하는 아카이브입니다. 기본 주소에는 Namkyu Yeo의 짧은 소개와 작품 목록만 표시됩니다.

## Projects

| Path | Work | Notes |
| --- | --- | --- |
| `/` | Archive | 프로젝트 목록만 표시하는 기본 주소 |
| `/sorry` | 잘못한 점 찾기 | 정적 인터랙션 |
| External | [Question Distorter](https://philosophical-artistic-perspectives-chat.ai.studio) | AI Studio에서 열림 |
| `/nicetomeetyou` | 만반잘부 | 카메라 권한을 사용하는 작업 |
| `/give-me-love` | give me love | 키보드 입력 기반 작업 |
| `/rgb-popups` | RGB Popups | 작은 팝업 창 세 개를 겹쳐 색을 섞는 작업 |
| `/scc-motion` | SCC Motion | 움직이는 SCC 타이포그래피 도구 |

정적 작품의 CSS·JavaScript·이미지는 각각의 작품 경로로 절대 참조합니다. `next.config.mjs`는 깨끗한 작품 URL을 해당 작품의 `index.html`로 rewrite합니다.

## Vercel deployment

1. Import `Soft-Coding-Club/scc-nky` into Vercel. The repository root is the project root; no custom build command is needed.
2. Deploy. The root URL serves the archive index and each work opens at the paths above.

The app has no server-side environment variables or API routes. Vercel is the configured production host.
