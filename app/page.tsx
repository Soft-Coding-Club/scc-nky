const projects = [
  { href: "/sorry", title: "잘못한 점 찾기" },
  { href: "https://philosophical-artistic-perspectives-chat.ai.studio", title: "Question Distorter", external: true },
  { href: "/nicetomeetyou", title: "만반잘부" },
  { href: "/give-me-love", title: "give me love" },
  { href: "/rgb-popups", title: "RGB Popups" },
  { href: "/scc-motion", title: "SCC Motion" },
  { href: "/sibuncho", title: "시분초" },
  { href: "/draw_key", title: "draw key" },
  { href: "/mobile/1", title: "404" },
];

export default function ArchiveHome() {
  return (
    <main className="archive">
      <nav aria-label="프로젝트 목록" className="projectList">
        {projects.map((project) => (
          <a
            className="projectName"
            href={project.href}
            key={project.href}
            rel={project.external ? "noreferrer" : undefined}
            target={project.external ? "_blank" : undefined}
          >
            {project.title}
          </a>
        ))}
      </nav>
    </main>
  );
}
