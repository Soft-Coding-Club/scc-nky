import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Question Distorter | SCC Archive",
  description: "Scroll through distorted intentions inside a question.",
};

export default function QuestionDistorterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
