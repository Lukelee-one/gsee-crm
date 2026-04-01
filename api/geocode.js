export default async function handler(req, res) {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: "address required" });
  try {
    const r = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}&analyze_type=similar`,
      { headers: { Authorization: "KakaoAK c1427d6e5bde83ce8b8aee89e7728541" } }
    );
    const data = await r.json();
    if (data.documents?.length > 0) {
      return res.json({ lat: data.documents[0].y, lng: data.documents[0].x });
    }
    const r2 = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}&size=1`,
      { headers: { Authorization: "KakaoAK c1427d6e5bde83ce8b8aee89e7728541" } }
    );
    const data2 = await r2.json();
    if (data2.documents?.length > 0) {
      return res.json({ lat: data2.documents[0].y, lng: data2.documents[0].x });
    }
    return res.json({ lat: null, lng: null });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}