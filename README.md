# SCC Archive

Soft Coding Club의 인터랙티브 작업을 한 도메인에서 탐색하는 아카이브입니다.

| URL | Project | Notes |
| --- | --- | --- |
| `/` | Archive | 프로젝트 목록만 표시하는 기본 주소 |
| `/sorry/` | 잘못한 점 찾기 | 정적 사이트 |
| `/question-distorter` | Question Distorter | Gemini API가 필요한 Next.js 작업 |
| `/nicetomeetyou/` | 만반잘부 | 카메라 권한을 사용하는 정적 사이트 |
| `/give-me-love/` | give me love | 키보드 입력 기반 정적 사이트 |
| `/rgb-popups/` | RGB Popups | 팝업 창을 여는 정적 사이트 |
| `/scc-motion/` | SCC Motion | Vite로 빌드한 정적 모션 도구 |

## Local development

```bash
npm ci
npm run dev
```

For Question Distorter, copy `.env.example` to `.env.local` and add a Gemini API key.

## Vercel deployment

1. Import `Soft-Coding-Club/scc-nky` into Vercel. The repository root is the project root; no custom build command is needed.
2. Add `GEMINI_API_KEY` in **Settings → Environment Variables** for Production (and Preview if desired). Optionally add `GEMINI_MODEL`; its default is `gemini-3.5-flash`.
3. Deploy. The root URL serves only the Archive index; each work is available at the paths above.

GitHub Pages can publish the static projects, but cannot run Question Distorter’s server-side API route or safely hold the Gemini key. Use Vercel for the complete archive.
