import { Innertube } from "https://esm.sh/youtubei.js@17.2.0/web.bundle";

const WORKER_URL =
  "https://yt-proxy.ahahadane.workers.dev/";

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const status = document.getElementById("status");
const results = document.getElementById("results");
const video = document.getElementById("video");
const videoTitle = document.getElementById("videoTitle");

let yt = null;

function setStatus(message) {
  status.textContent = message;
}

function extractVideoId(value) {
  try {
    const url = new URL(value);

    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1);
    }

    if (
      url.hostname === "youtube.com" ||
      url.hostname === "www.youtube.com"
    ) {
      return url.searchParams.get("v");
    }
  } catch {
    // URLではない場合
  }

  return null;
}

async function initYouTube() {
  if (yt) return yt;

  setStatus("YouTube.jsを初期化中...");

  yt = await Innertube.create({
    fetch: async (input, init = {}) => {
      const originalRequest =
        input instanceof Request
          ? input
          : new Request(input, init);

      const target = originalRequest.url;

      const proxyUrl =
        `${WORKER_URL}?url=${encodeURIComponent(target)}`;

      const method =
        originalRequest.method.toUpperCase();

      const headers =
        new Headers(originalRequest.headers);

      headers.delete("host");
      headers.delete("origin");
      headers.delete("referer");
      headers.delete("content-length");

      const requestInit = {
        method,
        headers,
        credentials: "omit"
      };

      if (method !== "GET" && method !== "HEAD") {
        requestInit.body =
          await originalRequest
            .clone()
            .arrayBuffer();
      }

      return fetch(proxyUrl, requestInit);
    }
  });

  setStatus("YouTube.js準備完了");

  return yt;
}

async function loadVideo(videoId) {
  const client = await initYouTube();

  setStatus("動画情報を取得中...");

  // 標準クライアントを使用
  const info = await client.getBasicInfo(videoId);

  const title =
    info.basic_info?.title ||
    "タイトル取得失敗";

  videoTitle.textContent = title;

  results.innerHTML = `
    <div class="result">
      <img
        class="thumbnail"
        src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg"
        alt=""
      >

      <div>
        <div class="result-title">
          ${escapeHtml(title)}
        </div>
      </div>
    </div>
  `;

  setStatus("動画情報を取得しました。");

  console.log("Video info:", info);

  return info;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function handleSearch() {
  const value = searchInput.value.trim();

  if (!value) {
    setStatus("YouTube URLを入力してください。");
    return;
  }

  const videoId = extractVideoId(value);

  if (!videoId) {
    setStatus(
      "YouTube URLを認識できませんでした。"
    );
    return;
  }

  try {
    await loadVideo(videoId);
  } catch (error) {
    console.error(error);

    setStatus(
      `取得失敗: ${error?.message || error}`
    );
  }
}

searchButton.addEventListener(
  "click",
  handleSearch
);

searchInput.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  }
);

setStatus("準備完了");
