import { NextResponse } from "next/server";
import { DISTORTION_MODES, type DistortionResponse } from "@/lib/distortionModes";

const QUESTION_LIMIT = 220;
const DEFAULT_MODEL = "gemini-3.5-flash";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["original", "distortions"],
  properties: {
    original: {
      type: "string",
      description: "The user's original question, unchanged.",
    },
    distortions: {
      type: "array",
      minItems: DISTORTION_MODES.length,
      maxItems: DISTORTION_MODES.length,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["mode", "question"],
        properties: {
          mode: {
            type: "string",
            enum: [...DISTORTION_MODES],
          },
          question: {
            type: "string",
            description: "One cold, literary Korean question for this mode.",
          },
        },
      },
    },
  },
};

function normalizeResult(question: string, parsed: DistortionResponse): DistortionResponse {
  const byMode = new Map(parsed.distortions.map((item) => [item.mode, item.question.trim()]));

  return {
    original: question,
    distortions: DISTORTION_MODES.map((mode) => ({
      mode,
      question: byMode.get(mode) || (mode === "표면 질문" ? question : `${question}`),
    })),
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY가 설정되어 있지 않습니다. Vercel 또는 .env.local에 서버 환경변수를 추가해 주세요.",
      },
      { status: 500 },
    );
  }

  let body: { question?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";

  if (!question) {
    return NextResponse.json({ error: "질문을 입력해 주세요." }, { status: 400 });
  }

  if (question.length > QUESTION_LIMIT) {
    return NextResponse.json(
      { error: `질문은 ${QUESTION_LIMIT}자 이하로 입력해 주세요.` },
      { status: 400 },
    );
  }

  try {
    const prompt = [
      "너는 질문에 답하지 않는다.",
      "너는 사용자의 질문을 차갑고 문학적인 한국어 질문들로 다시 왜곡한다.",
      "각 문장은 사용자의 질문 안에 숨어 있을 법한 다른 의도, 회피, 욕망, 두려움, 정당화를 드러내야 한다.",
      "상담, 조언, 판결, 해결책, 위로를 제공하지 말고 질문만 출력한다.",
      "각 mode는 정확히 한 번씩 사용한다.",
      "각 question은 반드시 한 문장, 물음표로 끝나는 한국어 질문이어야 한다.",
      "표면 질문 모드는 원문에 가장 가까운 재서술이어야 한다.",
      "",
      JSON.stringify({
        originalQuestion: question,
        modes: DISTORTION_MODES,
      }),
    ].join("\n");

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
        input: prompt,
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error(errorText);
      return NextResponse.json(
        { error: "Gemini API 호출 중 문제가 생겼습니다. 키와 모델 설정을 확인해 주세요." },
        { status: 502 },
      );
    }

    const response = (await geminiResponse.json()) as { output_text?: string };
    const outputText = response.output_text ?? "";
    const parsed = JSON.parse(outputText) as DistortionResponse;

    return NextResponse.json(normalizeResult(question, parsed));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "질문을 왜곡하는 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
