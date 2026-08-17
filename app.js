const WORKER_URL =
  "https://yt-proxy.ahahadane.workers.dev/";

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");

const status =
  document.getElementById("status");

const results =
  document.getElementById("results");

const videoTitle =
  document.getElementById("videoTitle");

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
  } catch {}

  return null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getPlayerInfo(videoId) {
  setStatus("Workerから動画情報を取得中...");

  const response = await fetch(
    `${WORKER_URL}api/player`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        videoId
      })
    }
  );

  const text = await response.text();

  console.log("Worker response:", {
    status: response.status,
    body: text
  });

  if (!response.ok) {
    throw new Error(
      `Worker error ${response.status}: ${text}`
    );
  }

  return JSON.parse(text);
}

async function handleSearch() {
  const value = searchInput.value.trim();

  if (!value) {
    setStatus("YouTube URLを入力してください。");
    return;
  }

  const videoId = extractVideoId(value);

  if (!videoId) {
    setStatus("YouTube URLを認識できませんでした。");
    return;
  }

  try {
    const data = await getPlayerInfo(videoId);

    console.log("YouTube player data:", data);

    const title =
      data.videoDetails?.title ||
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

    setStatus(`取得成功: ${title}`);

  } catch (error) {
    console.error("Player error:", error);

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
