"use client";

import Link from "next/link";
import { useState } from "react";

const projects = [
  {
    href: "/sorry/",
    number: "01",
    title: "잘못한 점 찾기",
    description: "장면을 고르고, 사과문을 출력하는 인터랙티브 작업.",
    kind: "Static site",
  },
  {
    href: "/nicetomeetyou/",
    number: "02",
    title: "만반잘부",
    description: "카메라와 함께 시작하는 짧은 인사말의 경험.",
    kind: "Camera experience",
  },
  {
    href: "/give-me-love/",
    number: "03",
    title: "give me love",
    description: "키보드 위에 하트 모양을 그려 사랑을 전합니다.",
    kind: "Keyboard experience",
  },
  {
    href: "/rgb-popups/",
    number: "04",
    title: "RGB Popups",
    description: "화면을 클릭해 팝업 세 창을 열고, 창을 겹쳐 색을 섞어 보세요.",
    kind: "Popup experience",
  },
  {
    href: "/scc-motion/",
    number: "05",
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
            Instagram @duskarb ↗
          </a>
          <a href="https://www.yeonamkyu.com/" rel="noreferrer" target="_blank">
            Website ↗
          </a>
          <a
            href="https://www.linkedin.com/in/namkyu-yeo-388045285/"
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn ↗
          </a>
          <a href="https://softcodingclub.vercel.app/" rel="noreferrer" target="_blank">
            Soft Coding Club ↗
          </a>
          <a href="https://www.instagram.com/softcodingclub/" rel="noreferrer" target="_blank">
            SCC Instagram ↗
          </a>
          <a
            href="https://philosophical-artistic-perspectives-chat.ai.studio"
            rel="noreferrer"
            target="_blank"
          >
            Philosophical &amp; Artistic Perspectives Chat ↗
          </a>
        </div>
      </header>

      <nav aria-label="프로젝트 목록" className="projectList">
        {projects.map((project) => (
          <Link
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
          >
            <span className="projectNumber">{project.number}</span>
            <span className="projectInfo">
              <span className="projectTitle">{project.title}</span>
            </span>
            <span className="projectKind">{project.kind}</span>
            <span aria-hidden="true" className="projectArrow">↗</span>
          </Link>
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
