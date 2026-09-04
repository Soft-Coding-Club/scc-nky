export const DISTORTION_MODES = [
  "표면 질문",
  "허락받기",
  "붙잡기",
  "회피하기",
  "정당화하기",
  "상처 감추기",
  "책임 넘기기",
  "반대로 말하기",
  "이미 아는 답",
] as const;

export type DistortionMode = (typeof DISTORTION_MODES)[number];

export type Distortion = {
  mode: DistortionMode;
  question: string;
};

export type DistortionResponse = {
  original: string;
  distortions: Distortion[];
};
