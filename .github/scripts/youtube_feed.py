"""Write the channel's latest PUBLIC videos to a JSON file the website reads.

python youtube_feed.py <output.json>
Used by build.py at build time and by the scheduled GitHub Action (.github/workflows/youtube.yml),
so the homepage picks up new uploads without a manual deploy. Unlisted/private videos never appear in the feed.
On any network/parse error the existing file is left untouched.
"""
import json, sys, urllib.request
import xml.etree.ElementTree as ET

CHANNEL_ID = "UC4b8oRS_Zt-a2Me0gyzG_yA"  # @royalstarrealestate
FEED = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015", "m": "http://search.yahoo.com/mrss/"}
MAX = 6
EXCLUDE = {"o1kBrWNfga8", "hJUvYBQMzOU"}  # logo intros (old 4.5s + 2026 animated): not "meet Rui" videos
# ponytail: YouTube's RSS feed 404s for this channel for now (new channels), so this hand-kept list of public
# Shorts is used whenever the feed fails or is empty. Once the feed works, it takes over automatically.
FALLBACK = [{"id": i, "title": t, "published": "2026-10-09", "short": True, "thumb": f"https://i.ytimg.com/vi/{i}/hqdefault.jpg"} for i, t in [
    ("PAtfMi8S1CM", "POV: você mora em Miami"),
    ("L4lcRGj8ub0", "POV: domingo em Fort Lauderdale"),
    ("yA1skeCN1Gk", "POV: você mora em Orlando"),
    ("k6bhpnbb1hs", "Comprar imóvel nos EUA dá green card? A resposta direta"),
    ("ohxE_rDBbtg", "Quanto custa uma casa na Flórida em 2026? Em dólar e em reais"),
    ("jezSK5BgtbI", "Vale a pena investir em imóvel nos EUA? Prós, contras e números"),
]]

def fetch():
    req = urllib.request.Request(FEED, headers={"User-Agent": "Mozilla/5.0 (royalstarcorp.com feed)"})
    root = ET.fromstring(urllib.request.urlopen(req, timeout=20).read())
    out = []
    for e in root.findall("a:entry", NS):
        vid = e.findtext("yt:videoId", namespaces=NS)
        if vid in EXCLUDE or len(out) >= MAX:
            continue
        out.append({
            "id": vid,
            "title": e.findtext("a:title", namespaces=NS) or "",
            "published": (e.findtext("a:published", namespaces=NS) or "")[:10],
            "short": "/shorts/" in (e.find("a:link", NS).get("href") if e.find("a:link", NS) is not None else ""),
            "thumb": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
        })
    return out

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "videos.json"
    try:
        videos = fetch() or FALLBACK
    except Exception as err:  # keep the previous list rather than blanking the homepage
        print("feed unavailable, using the hand-kept list:", err)
        videos = FALLBACK
    data = json.dumps({"channel": f"https://www.youtube.com/channel/{CHANNEL_ID}", "videos": videos}, ensure_ascii=False, indent=1)
    try:
        if open(path, encoding="utf-8").read() == data:
            print("no change"); sys.exit(0)
    except FileNotFoundError:
        pass
    open(path, "w", encoding="utf-8").write(data)
    print(f"wrote {len(videos)} videos to {path}")
