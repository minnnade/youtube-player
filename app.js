const WORKER_URL = "https://yt-proxy.ahahadane.workers.dev/";

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const status = document.getElementById("status");
const results = document.getElementById("results");
const video = document.getElementById("video");
const videoTitle = document.getElementById("videoTitle");

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

  setStatus(`動画IDを取得しました: ${videoId}`);

  results.innerHTML = `
    <div class="result">
      <img
        class="thumbnail"
        src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg"
        alt=""
      >
      <div>
        <div class="result-title">
          動画を読み込み中...
        </div>
      </div>
    </div>
  `;

  videoTitle.textContent = "";
  video.removeAttribute("src");
  video.load();

  /*
   * 次の段階でここにYouTube.jsの
   * 動画情報取得・再生URL取得処理を追加する。
   */
}

searchButton.addEventListener("click", handleSearch);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

setStatus("準備完了");
