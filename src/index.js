import { Innertube } from "youtubei.js/cf-worker";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...CORS_HEADERS
    }
  });
}

let ytPromise = null;

async function getYouTube() {
  if (!ytPromise) {
    ytPromise = Innertube.create({
      lang: "ja",
      location: "JP"
    });
  }

  return ytPromise;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    if (url.pathname === "/api/test") {
      return json({
        ok: true,
        message: "Worker API is working"
      });
    }

    if (url.pathname === "/api/youtubejs") {
      if (request.method !== "POST") {
        return json({
          ok: false,
          error: "POST required"
        }, 405);
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          error: "Invalid JSON"
        }, 400);
      }

      const videoId = body.videoId;

      if (!videoId) {
        return json({
          ok: false,
          error: "videoId required"
        }, 400);
      }

      try {
        const yt = await getYouTube();
        const info = await yt.getInfo(videoId);

        const streamingData = info.streaming_data || null;

        return json({
          ok: true,
          videoId,
          title: info.basic_info?.title || null,

          hasStreamingData: !!streamingData,

          streamingKeys: streamingData
            ? Object.keys(streamingData)
            : [],

          formatCount: streamingData?.formats?.length || 0,

          adaptiveFormatCount:
            streamingData?.adaptive_formats?.length || 0
        });

      } catch (error) {
        console.error("YouTube.js error:", error);

        return json({
          ok: false,
          errorName: error?.name || null,
          errorMessage: error?.message || String(error),
          errorString: String(error)
        }, 500);
      }
    }

    return json({
      ok: false,
      error: "Not found"
    }, 404);
  }
};
