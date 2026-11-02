"use client";

import { useEffect, useState } from "react";

type Lang = "en" | "ko";

const LANG_STORAGE_KEY = "scc-nky-lang";

const copy = {
  en: {
    linksAria: "External links",
    navAria: "Project list",
    toggleLabel: "한국어",
    toggleAria: "Switch to Korean",
    projects: [
      {
        href: "/sorry",
        number: "01",
        title: "Find the Fault",
        description: "Pick a scene and print out an apology letter.",
        kind: "Static site",
      },
      {
        href: "https://philosophical-artistic-perspectives-chat.ai.studio",
        number: "02",
        title: "Question Distorter",
        description: "Turns a question into one from another perspective. Opens in AI Studio.",
        kind: "AI Studio",
        external: true,
      },
      {
        href: "/nicetomeetyou",
        number: "03",
        title: "Nice to Meet You",
        description: "A short greeting experience that starts with your camera.",
        kind: "Camera experience",
      },
      {
        href: "/give-me-love",
        number: "04",
        title: "give me love",
        description: "Draw a heart shape on your keyboard to send love.",
        kind: "Keyboard experience",
      },
      {
        href: "/rgb-popups",
        number: "05",
        title: "RGB Popups",
        description: "Opens as three small popup windows instead of one fullscreen. Overlap them to mix colors.",
        kind: "Popup experience",
      },
      {
        href: "/scc-motion",
        number: "06",
        title: "SCC Motion",
        description: "Create and export moving SCC typography.",
        kind: "Motion tool",
      },
      {
        href: "/sibuncho",
        number: "07",
        title: "Sibuncho",
        description: "A real-time world clock that turns the day's hours, minutes and seconds into RGB color.",
        kind: "World clock",
      },
      {
        href: "/draw_key",
        number: "08",
        title: "draw key",
        description: "Records your typing as a drawing, connecting the direction of movement between keys into lines.",
        kind: "Keyboard drawing",
      },
    ],
  },
  ko: {
    linksAria: "외부 링크",
    navAria: "프로젝트 목록",
    toggleLabel: "EN",
    toggleAria: "Switch to English",
    projects: [
      {
        href: "/sorry",
        number: "01",
        title: "잘못한 점 찾기",
        description: "장면을 고르고, 사과문을 출력하는 인터랙티브 작업.",
        kind: "Static site",
      },
      {
        href: "https://philosophical-artistic-perspectives-chat.ai.studio",
        number: "02",
        title: "Question Distorter",
        description: "질문을 다른 관점의 질문으로 변환합니다. AI Studio에서 열립니다.",
        kind: "AI Studio",
        external: true,
      },
      {
        href: "/nicetomeetyou",
        number: "03",
        title: "만반잘부",
        description: "카메라와 함께 시작하는 짧은 인사말의 경험.",
        kind: "Camera experience",
      },
      {
        href: "/give-me-love",
        number: "04",
        title: "give me love",
        description: "키보드 위에 하트 모양을 그려 사랑을 전합니다.",
        kind: "Keyboard experience",
      },
      {
        href: "/rgb-popups",
        number: "05",
        title: "RGB Popups",
        description: "전체화면이 아닌 작은 팝업 창 세 개로 열립니다. 창을 겹쳐 색을 섞어 보세요.",
        kind: "Popup experience",
      },
      {
        href: "/scc-motion",
        number: "06",
        title: "SCC Motion",
        description: "움직이는 SCC 타이포그래피를 만들고 내보냅니다.",
        kind: "Motion tool",
      },
      {
        href: "/sibuncho",
        number: "07",
        title: "시분초",
        description: "24시간의 시·분·초를 RGB 색으로 보여주는 실시간 세계시계.",
        kind: "World clock",
      },
      {
        href: "/draw_key",
        number: "08",
        title: "draw key",
        description: "키보드 위 키 사이의 이동 방향을 선으로 이어, 키 입력의 움직임을 그림으로 기록합니다.",
        kind: "Keyboard drawing",
      },
    ],
  },
} as const;

export default function ArchiveHome() {
  const [lang, setLang] = useState<Lang>("en");
  const [tooltip, setTooltip] = useState<{
    description: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "ko" || saved === "en") setLang(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => {
    const next: Lang = lang === "en" ? "ko" : "en";
    setLang(next);
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
  };

  const t = copy[lang];

  return (
    <main className="archive">
      <header className="archiveHeader">
        <div className="archiveTopline">
          <p>NAMKYU YEO / ARCHIVE</p>
          <button
            aria-label={t.toggleAria}
            className="langToggle"
            onClick={toggleLang}
            type="button"
          >
            {t.toggleLabel}
          </button>
        </div>
        <p className="archiveIntro">
          Community builder, designer, and creative technologist based in Daejeon &amp; Seoul.
          I work with AI interfaces, installations, and experimental software.
        </p>
        <img alt="Soft Coding Club logo" className="archiveLogo" src="/namkyu-yeo.png" />
        <div aria-label={t.linksAria} className="archiveLinks">
          <a href="https://www.instagram.com/duskarb/" rel="noreferrer" target="_blank">
            @duskarb ↗
          </a>
          <a href="https://www.yeonamkyu.com/" rel="noreferrer" target="_blank">
            yeonamkyu ↗
          </a>
          <a
            href="https://www.linkedin.com/in/namkyu-yeo-388045285/"
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn ↗
          </a>
          <a href="https://softcodingclub.vercel.app/" rel="noreferrer" target="_blank">
            SCC ↗
          </a>
          <a href="https://www.instagram.com/softcodingclub/" rel="noreferrer" target="_blank">
            @softcodingclub ↗
          </a>
        </div>
      </header>

      <nav aria-label={t.navAria} className="projectList">
        {t.projects.map((project) => (
          <a
            aria-label={`${project.title}: ${project.description}`}
            className="projectCard"
            href={project.href}
            key={project.href}
            onMouseEnter={(event) =>
              setTooltip({
                description: project.description,
                x: event.clientX,
                y: event.clientY,
              })
            }
            onMouseLeave={() => setTooltip(null)}
            onMouseMove={(event) =>
              setTooltip((current) =>
                current
                  ? { ...current, description: project.description, x: event.clientX, y: event.clientY }
                  : null,
              )
            }
            rel={"external" in project && project.external ? "noreferrer" : undefined}
            target={"external" in project && project.external ? "_blank" : undefined}
          >
            <span className="projectNumber">{project.number}</span>
            <span className="projectInfo">
              <span className="projectTitle">{project.title}</span>
            </span>
            <span className="projectKind">{project.kind}</span>
            <span aria-hidden="true" className="projectArrow">↗</span>
          </a>
        ))}
      </nav>

      {tooltip ? (
        <aside
          aria-hidden="true"
          className="projectTooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.description}
        </aside>
      ) : null}

      <footer className="archiveFooter">© Namkyu Yeo / Soft Coding Club</footer>
    </main>
  );
}
