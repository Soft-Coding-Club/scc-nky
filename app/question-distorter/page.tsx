"use client";

import {
  FormEvent,
  KeyboardEvent,
  type CSSProperties,
  useMemo,
  useRef,
  useState,
} from "react";
import { DISTORTION_MODES, type DistortionResponse } from "@/lib/distortionModes";

type RequestState = "idle" | "loading" | "ready" | "error";

const inputPlaceholder = "질문 입력";

const initialQuestions: Record<(typeof DISTORTION_MODES)[number], string> = {
  "표면 질문": "질문을 입력하면 무엇이 먼저 보이게 될까?",
  허락받기: "질문을 입력하면 어떤 허락을 기다리고 있을까?",
  붙잡기: "질문을 입력하면 무엇을 놓지 못하는지 드러날까?",
  회피하기: "질문을 입력하면 무엇을 피하고 있는지 보일까?",
  정당화하기: "질문을 입력하면 어떤 이유가 뒤늦게 붙을까?",
  "상처 감추기": "질문을 입력하면 어떤 상처가 말없이 접혀 있을까?",
  "책임 넘기기": "질문을 입력하면 누구에게 결정을 넘기고 있을까?",
  "반대로 말하기": "질문을 입력하면 반대로 말한 마음이 드러날까?",
  "이미 아는 답": "질문을 입력하면 이미 알고 있던 답이 흔들릴까?",
};

const initialDistortions = DISTORTION_MODES.map((mode) => ({
  mode,
  question: initialQuestions[mode],
}));

export default function Home() {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<RequestState>("ready");
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [result, setResult] = useState<DistortionResponse>({
    original: "",
    distortions: initialDistortions,
  });
  const lastWheelAt = useRef(0);

  const active = result.distortions[selectedIndex] ?? result.distortions[0];

  const wheelItems = useMemo(() => {
    return result.distortions.map((item, index) => {
      const distance = index - selectedIndex;
      return {
        ...item,
        distance,
        isActive: index === selectedIndex,
      };
    });
  }, [result, selectedIndex]);

  function moveSelection(direction: 1 | -1) {
    setSelectedIndex((current) => {
      const next = current + direction;
      if (next < 0) return result.distortions.length - 1;
      if (next >= result.distortions.length) return 0;
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();

    if (!trimmed) {
      setState("error");
      setError("질문을 입력해 주세요.");
      return;
    }

    setState("loading");
    setError("");
    setHasSubmitted(true);

    try {
      const response = await fetch("/api/question-distorter/distort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "생성에 실패했습니다.");
      }

      setResult(data);
      setSelectedIndex(0);
      setState("ready");
    } catch (caught) {
      setState("error");
      setError(caught instanceof Error ? caught.message : "생성에 실패했습니다.");
    }
  }

  function handleWheel(event: React.WheelEvent<HTMLElement>) {
    if (!hasSubmitted || state === "loading") return;
    event.preventDefault();

    const now = Date.now();
    if (now - lastWheelAt.current < 170) return;
    lastWheelAt.current = now;

    moveSelection(event.deltaY > 0 ? 1 : -1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!hasSubmitted || state === "loading") return;

    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      moveSelection(1);
    }

    if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      moveSelection(-1);
    }
  }

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <main
      className={`shell ${hasSubmitted ? "resultMode" : "composeMode"}`}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="phoneSurface">
        <header className="navBar">
          <span className="navGhost" aria-hidden="true" />
          <div className="navTitle">{hasSubmitted ? "Distortions" : ""}</div>
          <button
            aria-label="새 질문"
            className="newQuestionButton"
            onClick={() => {
              setHasSubmitted(false);
              setState("ready");
              setError("");
              setQuestion("");
              setSelectedIndex(0);
            }}
            type="button"
          >
            New
          </button>
        </header>

        <form className="composeForm" onSubmit={handleSubmit}>
          <label className="inputShell">
            <textarea
              aria-label="원래 질문"
              disabled={state === "loading"}
              maxLength={220}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleQuestionKeyDown}
              placeholder={inputPlaceholder}
              rows={1}
              value={question}
            />
          </label>
          <div className={`composeHint ${state === "error" ? "error" : ""}`}>
            {state === "error" && !hasSubmitted ? error : state === "loading" ? "왜곡 중" : ""}
          </div>
        </form>

        {hasSubmitted ? (
          <section className="resultStack">
            <section className="questionPanel" aria-live="polite">
              <p className="modeLabel">{active.mode}</p>
              <p className="distortedQuestion">
                {state === "loading" ? "질문이 다른 말로 기울어지는 중..." : active.question}
              </p>
              <div className={`statusLine ${state === "error" ? "error" : ""}`}>
                {state === "error" ? error : result.original || " "}
              </div>
            </section>

            <aside className="wheel" aria-label="왜곡 모드">
              <div className="wheelCenter" />
              <div className="wheelGlass" />
              {wheelItems.map((item, index) => (
                <button
                  className={`wheelItem ${item.isActive ? "active" : ""}`}
                  key={item.mode}
                  onClick={() => {
                    setSelectedIndex(index);
                    if (state === "idle") setState("ready");
                  }}
                  style={
                    {
                      "--distance": item.distance,
                      "--abs-distance": Math.abs(item.distance),
                    } as CSSProperties
                  }
                  type="button"
                >
                  <span>{item.mode}</span>
                </button>
              ))}
            </aside>
          </section>
        ) : null}
      </div>
    </main>
  );
}
