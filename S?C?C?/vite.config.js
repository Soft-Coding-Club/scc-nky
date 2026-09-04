import { defineConfig } from "vite";

export default defineConfig({
  // @ffmpeg/ffmpeg 은 워커를 new URL("./worker.js", import.meta.url) 로 만든다.
  // Vite 가 이 패키지를 .vite/deps 로 사전 번들하면 그 경로가 404 가 되고,
  // 워커 생성 실패에 대한 에러 핸들러가 없어서 load() 가 영원히 안 끝난다.
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
});
