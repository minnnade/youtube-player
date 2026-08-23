import { Innertube } from 'youtubei.js/web';

let yt;
export default {
  async fetch(req) {
    const url = new URL(req.url);
    const videoId = url.searchParams.get('v');
    if (!videoId) return new Response('動画ID (?v=xxx) がありません', { status: 400 });

    try {
      // 1. YouTubeの動画情報を取得
      if (!yt) yt = await Innertube.create({ fetch: (u, o) => fetch(u, o) });
      const format = await yt.getStreamingData(videoId, { type: 'video+audio', quality: 'best' });

      // 2. ブラウザからの動画リクエスト（Range）をそのままYouTubeに流す
      const ytHeaders = new Headers({ 'User-Agent': 'Mozilla/5.0' });
      if (req.headers.has('range')) ytHeaders.set('range', req.headers.get('range'));

      // 3. YouTubeから動画データを引っ張ってくる
      const res = await fetch(format.url, { headers: ytHeaders });

      // 4. CORSエラーが起きないようにしてブラウザに動画を返す
      const headers = new Headers(res.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Headers', '*');
      
      return new Response(res.body, { status: res.status, headers });
    } catch (e) {
      return new Response(`エラー: ${e.message}`, { status: 500 });
    }
  }
};
