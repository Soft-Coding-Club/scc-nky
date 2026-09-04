import Link from "next/link";

const projects = [
  {
    href: "/sorry/",
    number: "01",
    title: "잘못한 점 찾기",
    description: "장면을 고르고, 사과문을 출력하는 인터랙티브 작업.",
    kind: "Static site",
  },
  {
    href: "/question-distorter",
    number: "02",
    title: "Question Distorter",
    description: "하나의 질문 속 의도를 여러 갈래의 질문으로 왜곡합니다.",
    kind: "Gemini-powered",
  },
  {
    href: "/nicetomeetyou/",
    number: "03",
    title: "만반잘부",
    description: "카메라와 함께 시작하는 짧은 인사말의 경험.",
    kind: "Camera experience",
  },
  {
    href: "/give-me-love/",
    number: "04",
    title: "give me love",
    description: "키보드 위에 하트 모양을 그려 사랑을 전합니다.",
    kind: "Keyboard experience",
  },
  {
    href: "/rgb-popups/",
    number: "05",
    title: "RGB Popups",
    description: "겹쳐지는 세 개의 팝업 창으로 색을 섞습니다.",
    kind: "Popup experience",
  },
  {
    href: "/scc-motion/",
    number: "06",
    title: "SCC Motion",
    description: "움직이는 SCC 타이포그래피를 만들고 내보냅니다.",
    kind: "Motion tool",
  },
];

export default function ArchiveHome() {
  return (
    <main className="archive">
      <header className="archiveHeader">
        <p className="archiveEyebrow">SOFT CODING CLUB</p>
        <h1>Archive</h1>
        <p className="archiveIntro">작고 이상한 웹 작업들을 모아 둡니다.</p>
      </header>

      <nav aria-label="프로젝트 목록" className="projectList">
        {projects.map((project) => (
          <Link className="projectCard" href={project.href} key={project.href}>
            <span className="projectNumber">{project.number}</span>
            <span className="projectInfo">
              <span className="projectTitle">{project.title}</span>
              <span className="projectDescription">{project.description}</span>
            </span>
            <span className="projectKind">{project.kind}</span>
            <span aria-hidden="true" className="projectArrow">↗</span>
          </Link>
        ))}
      </nav>

      <footer className="archiveFooter">© Soft Coding Club</footer>
    </main>
  );
}
