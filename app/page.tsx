"use client";

import { useEffect, useState } from "react";

type Lang = "en" | "ko";

const LANG_STORAGE_KEY = "scc-nky-lang";

const languageLabels = {
  en: { nav: "Project list", toggle: "한국어", toggleAria: "Switch to Korean" },
  ko: { nav: "프로젝트 목록", toggle: "EN", toggleAria: "Switch to English" },
};

const projects = [
  { href: "/sorry", title: "잘못한 점 찾기", englishTitle: "Find the Fault" },
  { href: "https://philosophical-artistic-perspectives-chat.ai.studio", title: "Question Distorter", external: true },
  { href: "/nicetomeetyou", title: "만반잘부", englishTitle: "Nice to Meet You" },
  { href: "/give-me-love", title: "give me love" },
  { href: "/rgb-popups", title: "RGB Popups" },
  { href: "/scc-motion", title: "SCC Motion" },
  { href: "/sibuncho", title: "시분초", englishTitle: "Sibuncho" },
  { href: "/draw_key", title: "draw key" },
  { href: "/mobile/1", title: "404" },
];

export default function ArchiveHome() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === "ko" || saved === "en") setLang(saved);
    } catch {
      // Sandboxed embeds can block storage. Keep the default language.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => {
    const next: Lang = lang === "en" ? "ko" : "en";
    setLang(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // The choice still applies to this visit when storage is unavailable.
    }
  };

  const labels = languageLabels[lang];

  return (
    <main className="archive">
      <button
        aria-label={labels.toggleAria}
        className="langToggle"
        onClick={toggleLang}
        type="button"
      >
        {labels.toggle}
      </button>
      <nav aria-label={labels.nav} className="projectList">
        {projects.map((project) => (
          <a
            className="projectName"
            href={project.href}
            key={project.href}
            rel={project.external ? "noreferrer" : undefined}
            target={project.external ? "_blank" : undefined}
          >
            {lang === "en" ? (project.englishTitle ?? project.title) : project.title}
          </a>
        ))}
      </nav>
    </main>
  );
}
