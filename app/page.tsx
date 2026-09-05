"use client";

import { useState } from "react";

const projects = [
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
];

export default function ArchiveHome() {
  const [tooltip, setTooltip] = useState<{
    description: string;
    x: number;
    y: number;
  } | null>(null);

  return (
    <main className="archive">
      <header className="archiveHeader">
        <p>NAMKYU YEO / ARCHIVE</p>
        <p className="archiveIntro">
          Community builder, designer, and creative technologist based in Daejeon &amp; Seoul.
          I work with AI interfaces, installations, and experimental software.
        </p>
        <img alt="Soft Coding Club logo" className="archiveLogo" src="/namkyu-yeo.png" />
        <div aria-label="외부 링크" className="archiveLinks">
          <a href="https://www.instagram.com/duskarb/" rel="noreferrer" target="_blank">
            Instagram — @duskarb ↗
          </a>
          <a href="https://www.yeonamkyu.com/" rel="noreferrer" target="_blank">
            Website — yeonamkyu.com ↗
          </a>
          <a
            href="https://www.linkedin.com/in/namkyu-yeo-388045285/"
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn — Namkyu Yeo ↗
          </a>
          <a href="https://softcodingclub.vercel.app/" rel="noreferrer" target="_blank">
            Website — Soft Coding Club ↗
          </a>
          <a href="https://www.instagram.com/softcodingclub/" rel="noreferrer" target="_blank">
            Instagram — @softcodingclub ↗
          </a>
        </div>
      </header>

      <nav aria-label="프로젝트 목록" className="projectList">
        {projects.map((project) => (
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
            rel={project.external ? "noreferrer" : undefined}
            target={project.external ? "_blank" : undefined}
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
