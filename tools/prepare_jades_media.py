#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import html
import json
import math
import re
import shutil
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


IMAGE_EXTS = {".jpg", ".jpeg"}
VIDEO_EXTS = {".mp4", ".mov", ".m4v"}


@dataclass
class MediaItem:
    index: int
    path: Path
    kind: str
    size_bytes: int
    width: int | None = None
    height: int | None = None
    duration: float | None = None
    captured_at: datetime | None = None
    quality_score: float | None = None
    brightness: float | None = None
    contrast: float | None = None
    sharpness: float | None = None
    vector: list[int] | None = None

    @property
    def name(self) -> str:
        return self.path.name

    @property
    def stem(self) -> str:
        return self.path.stem


def run(cmd: list[str], timeout: int | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)


def parse_capture_time(path: Path) -> datetime | None:
    match = re.search(r"_(\d{8})_(\d{6})", path.name)
    if not match:
        return None
    return datetime.strptime(f"{match.group(1)}{match.group(2)}", "%Y%m%d%H%M%S")


def ffprobe(path: Path) -> dict:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,duration:format=duration",
        "-of",
        "json",
        str(path),
    ]
    try:
        data = json.loads(run(cmd, timeout=12).stdout)
    except Exception:
        return {}
    stream = (data.get("streams") or [{}])[0]
    fmt = data.get("format") or {}
    duration = stream.get("duration") or fmt.get("duration")
    return {
        "width": stream.get("width"),
        "height": stream.get("height"),
        "duration": float(duration) if duration else None,
    }


def raw_frame(path: Path, size: int = 48, video: bool = False) -> bytes | None:
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error"]
    if video:
        cmd += ["-ss", "1"]
    cmd += [
        "-i",
        str(path),
        "-frames:v",
        "1",
        "-vf",
        f"scale={size}:{size}:force_original_aspect_ratio=increase,crop={size}:{size},format=rgb24",
        "-f",
        "rawvideo",
        "-",
    ]
    try:
        return run(cmd, timeout=20).stdout
    except Exception:
        if not video:
            return None
        cmd = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(path),
            "-frames:v",
            "1",
            "-vf",
            f"scale={size}:{size}:force_original_aspect_ratio=increase,crop={size}:{size},format=rgb24",
            "-f",
            "rawvideo",
            "-",
        ]
        try:
            return run(cmd, timeout=20).stdout
        except Exception:
            return None


def analyze_quality(item: MediaItem) -> None:
    raw = raw_frame(item.path, size=48, video=item.kind == "video")
    if not raw:
        return

    pixels = [raw[i : i + 3] for i in range(0, len(raw), 3)]
    gray = [(p[0] * 0.299 + p[1] * 0.587 + p[2] * 0.114) for p in pixels]
    mean = sum(gray) / len(gray)
    variance = sum((g - mean) ** 2 for g in gray) / len(gray)
    contrast = math.sqrt(variance)

    size = 48
    lap_values = []
    for y in range(1, size - 1):
        for x in range(1, size - 1):
            center = gray[y * size + x]
            lap = (
                -4 * center
                + gray[(y - 1) * size + x]
                + gray[(y + 1) * size + x]
                + gray[y * size + x - 1]
                + gray[y * size + x + 1]
            )
            lap_values.append(lap)
    lap_mean = sum(lap_values) / len(lap_values)
    sharpness = sum((v - lap_mean) ** 2 for v in lap_values) / len(lap_values)

    exposure = max(0, 1 - abs(mean - 132) / 132)
    contrast_score = min(1, contrast / 62)
    sharp_score = min(1, sharpness / 820)

    item.brightness = round(mean, 2)
    item.contrast = round(contrast, 2)
    item.sharpness = round(sharpness, 2)
    item.quality_score = round((0.35 * exposure + 0.25 * contrast_score + 0.4 * sharp_score) * 100, 1)
    item.vector = list(raw)


def vector_distance(a: MediaItem, b: MediaItem) -> float | None:
    if not a.vector or not b.vector or len(a.vector) != len(b.vector):
        return None
    total = sum(abs(x - y) for x, y in zip(a.vector, b.vector))
    return total / len(a.vector) / 255


def inventory(raw_dir: Path) -> list[MediaItem]:
    files = sorted([p for p in raw_dir.iterdir() if p.is_file()], key=lambda p: p.name.lower())
    items: list[MediaItem] = []
    for index, path in enumerate(files, start=1):
        ext = path.suffix.lower()
        if ext in IMAGE_EXTS:
            kind = "image"
        elif ext in VIDEO_EXTS:
            kind = "video"
        else:
            kind = "other"

        stat = path.stat()
        meta = ffprobe(path) if kind in {"image", "video"} else {}
        item = MediaItem(
            index=index,
            path=path,
            kind=kind,
            size_bytes=stat.st_size,
            width=meta.get("width"),
            height=meta.get("height"),
            duration=meta.get("duration"),
            captured_at=parse_capture_time(path),
        )
        if kind in {"image", "video"}:
            analyze_quality(item)
        items.append(item)
        if index % 50 == 0:
            print(f"Analyzed {index}/{len(files)}")
    return items


def burst_groups(items: list[MediaItem], max_gap_seconds: int = 14) -> list[list[MediaItem]]:
    dated = [item for item in items if item.captured_at and item.kind in {"image", "video"}]
    dated.sort(key=lambda item: item.captured_at or datetime.max)
    groups: list[list[MediaItem]] = []
    current: list[MediaItem] = []
    last_time: datetime | None = None

    for item in dated:
        if last_time and item.captured_at and (item.captured_at - last_time).total_seconds() > max_gap_seconds:
            if len(current) > 1:
                groups.append(current)
            current = []
        current.append(item)
        last_time = item.captured_at

    if len(current) > 1:
        groups.append(current)
    return groups


def visual_candidate_groups(groups: list[list[MediaItem]], threshold: float = 0.145) -> list[dict]:
    candidates = []
    for group in groups:
        if len(group) < 2:
            continue

        similar_pairs = []
        for idx, item in enumerate(group):
            for other in group[idx + 1 :]:
                if item.kind != other.kind:
                    continue
                distance = vector_distance(item, other)
                if distance is not None and distance <= threshold:
                    similar_pairs.append((item, other, distance))

        if not similar_pairs:
            continue

        members = {}
        for item, other, distance in similar_pairs:
            members[item.name] = item
            members[other.name] = other

        ranked = sorted(members.values(), key=lambda item: item.quality_score or 0, reverse=True)
        candidates.append(
            {
                "count": len(ranked),
                "kind": ranked[0].kind if ranked else "mixed",
                "start": ranked[0].captured_at.isoformat() if ranked and ranked[0].captured_at else None,
                "suggested_keep": ranked[0].name if ranked else None,
                "files": [
                    {
                        "name": item.name,
                        "path": str(item.path),
                        "kind": item.kind,
                        "quality_score": item.quality_score,
                        "size_mb": round(item.size_bytes / 1024 / 1024, 2),
                    }
                    for item in ranked
                ],
            }
        )

    candidates.sort(key=lambda group: (-group["count"], group.get("start") or ""))
    return candidates


def polish_image(source: Path, jpg_out: Path, avif_out: Path, thumb_out: Path, force: bool = False) -> None:
    jpg_out.parent.mkdir(parents=True, exist_ok=True)
    avif_out.parent.mkdir(parents=True, exist_ok=True)
    thumb_out.parent.mkdir(parents=True, exist_ok=True)

    polish_filter = (
        "scale='if(gt(iw,ih),min(1800,iw),-2)':'if(gt(iw,ih),-2,min(1800,ih))',"
        "eq=contrast=1.035:saturation=1.015:brightness=0.003,"
        "unsharp=5:5:0.34:3:3:0.08"
    )

    if force or not jpg_out.exists():
        run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(source),
                "-vf",
                polish_filter,
                "-q:v",
                "2",
                "-y",
                str(jpg_out),
            ],
            timeout=35,
        )

    if force or not thumb_out.exists():
        run(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(jpg_out),
                "-vf",
                "scale=360:360:force_original_aspect_ratio=increase,crop=360:360",
                "-q:v",
                "4",
                "-y",
                str(thumb_out),
            ],
            timeout=20,
        )

    if force or not avif_out.exists():
        # sips uses Apple's image encoders and is much faster than software AV1 here.
        run(["sips", "-s", "format", "avif", str(jpg_out), "--out", str(avif_out)], timeout=35)


def make_video_poster(source: Path, poster_out: Path, force: bool = False) -> None:
    poster_out.parent.mkdir(parents=True, exist_ok=True)
    if poster_out.exists() and not force:
        return
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-ss",
        "1",
        "-i",
        str(source),
        "-frames:v",
        "1",
        "-vf",
        "scale='if(gt(iw,ih),min(1400,iw),-2)':'if(gt(iw,ih),-2,min(1400,ih))',eq=contrast=1.025:saturation=1.01,unsharp=5:5:0.25",
        "-q:v",
        "3",
        "-y",
        str(poster_out),
    ]
    try:
        run(cmd, timeout=30)
    except Exception:
        cmd = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(source),
            "-frames:v",
            "1",
            "-vf",
            "scale='if(gt(iw,ih),min(1400,iw),-2)':'if(gt(iw,ih),-2,min(1400,ih))',eq=contrast=1.025:saturation=1.01,unsharp=5:5:0.25",
            "-q:v",
            "3",
            "-y",
            str(poster_out),
        ]
        run(cmd, timeout=30)


def write_reports(out_dir: Path, items: list[MediaItem], duplicate_candidates: list[dict]) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "file_count": len(items),
        "image_count": sum(1 for item in items if item.kind == "image"),
        "video_count": sum(1 for item in items if item.kind == "video"),
        "total_size_gb": round(sum(item.size_bytes for item in items) / 1024 / 1024 / 1024, 2),
        "duplicate_candidate_groups": len(duplicate_candidates),
        "duplicate_candidate_files": sum(group["count"] for group in duplicate_candidates),
    }
    rows = []
    for item in items:
        rows.append(
            {
                "index": item.index,
                "name": item.name,
                "kind": item.kind,
                "size_mb": round(item.size_bytes / 1024 / 1024, 2),
                "width": item.width,
                "height": item.height,
                "duration": round(item.duration, 2) if item.duration else "",
                "captured_at": item.captured_at.isoformat() if item.captured_at else "",
                "quality_score": item.quality_score,
                "brightness": item.brightness,
                "contrast": item.contrast,
                "sharpness": item.sharpness,
                "path": str(item.path),
            }
        )

    with (out_dir / "inventory.csv").open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    with (out_dir / "summary.json").open("w") as file:
        json.dump({"summary": summary, "duplicate_candidates": duplicate_candidates}, file, indent=2)

    with (out_dir / "duplicate_candidates.json").open("w") as file:
        json.dump(duplicate_candidates, file, indent=2)

    write_duplicate_review_html(out_dir, duplicate_candidates)
    write_prepared_review_html(out_dir, items)


def write_duplicate_review_html(out_dir: Path, duplicate_candidates: list[dict]) -> None:
    css = """
    body{margin:0;background:#f7f5ef;color:#181818;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    header{position:sticky;top:0;background:rgba(247,245,239,.94);backdrop-filter:blur(14px);border-bottom:1px solid #ded9cd;padding:18px 28px;z-index:2}
    h1{margin:0;font-family:Georgia,serif;font-weight:400;letter-spacing:.08em}.note{color:#625d54;line-height:1.55;max-width:900px}
    section{padding:22px 28px;border-bottom:1px solid #e2ddd2}h2{font-size:16px;margin:0 0 12px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}.card{background:#fff;border:1px solid #ded9cd;border-radius:8px;overflow:hidden}
    .thumb{aspect-ratio:1/1;background:#e9e2d7;display:grid;place-items:center}.thumb img{width:100%;height:100%;object-fit:cover}
    .meta{padding:9px 10px;font-size:12px;line-height:1.35}.keep{outline:3px solid #8aa7a3}.badge{font-weight:700;color:#496b66}
    """
    parts = [
        f"<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Jades Duplicate Candidates</title><style>{css}</style></head><body>",
        "<header><h1>Jades Duplicate Candidates</h1><p class='note'>These are possible repeated shots based on timestamp bursts and visual similarity. The outlined image is only the script's best technical candidate, not an automatic decision.</p></header>",
    ]
    thumb_root = out_dir / "thumbs"
    for idx, group in enumerate(duplicate_candidates, 1):
        parts.append(f"<section><h2>Group {idx}: {group['count']} possible repeats · suggested keep: {html.escape(group.get('suggested_keep') or '')}</h2><div class='grid'>")
        for file_info in group["files"]:
            name = file_info["name"]
            thumb_matches = sorted(thumb_root.glob(f"*_{Path(name).stem}.jpg"))
            thumb_src = thumb_matches[0].relative_to(out_dir) if thumb_matches else ""
            keep_class = " card keep" if name == group.get("suggested_keep") else " card"
            parts.append(
                f"<article class='{keep_class}'><a class='thumb' href='{html.escape(str(file_info.get('path', '')))}'>"
                f"{f'<img src=\"{html.escape(str(thumb_src))}\" loading=\"lazy\" alt=\"{html.escape(name)}\">' if thumb_src else 'No thumbnail'}"
                f"</a><div class='meta'><div class='badge'>{'Suggested keep' if name == group.get('suggested_keep') else 'Candidate'}</div>"
                f"<div>{html.escape(name)}</div><div>Quality {file_info.get('quality_score')} · {file_info.get('size_mb')}MB</div></div></article>"
            )
        parts.append("</div></section>")
    parts.append("</body></html>")
    (out_dir / "duplicate_review.html").write_text("\n".join(parts), encoding="utf-8")


def session_groups(items: list[MediaItem], max_gap_minutes: int = 7) -> list[list[MediaItem]]:
    dated = [item for item in items if item.captured_at and item.kind in {"image", "video"}]
    dated.sort(key=lambda item: item.captured_at or datetime.max)
    groups: list[list[MediaItem]] = []
    current: list[MediaItem] = []
    last_time: datetime | None = None

    for item in dated:
        if last_time and item.captured_at and (item.captured_at - last_time).total_seconds() > max_gap_minutes * 60:
            if current:
                groups.append(current)
            current = []
        current.append(item)
        last_time = item.captured_at

    if current:
        groups.append(current)
    return groups


def write_prepared_review_html(out_dir: Path, items: list[MediaItem]) -> None:
    css = """
    body{margin:0;background:#f7f5ef;color:#181818;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    header{position:sticky;top:0;background:rgba(247,245,239,.94);backdrop-filter:blur(14px);border-bottom:1px solid #ded9cd;padding:18px 28px;z-index:2}
    h1{margin:0;font-family:Georgia,serif;font-weight:400;letter-spacing:.08em}.summary{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
    .pill{border:1px solid #cfc8bb;background:#fff;border-radius:999px;padding:6px 10px;font-size:12px}.note{color:#625d54;line-height:1.55;max-width:900px}
    section{padding:22px 28px;border-bottom:1px solid #e2ddd2}h2{font-size:16px;margin:0 0 12px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:14px}.card{background:#fff;border:1px solid #ded9cd;border-radius:8px;overflow:hidden}
    .thumb{position:relative;aspect-ratio:1/1;background:#e9e2d7;display:grid;place-items:center}.thumb img{width:100%;height:100%;object-fit:cover}
    .badge{position:absolute;left:8px;top:8px;background:rgba(24,24,24,.82);color:#fff;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:700}
    .meta{padding:9px 10px;font-size:12px;line-height:1.35}.name{font-weight:650;word-break:break-word}.sub{color:#625d54;margin-top:4px}
    """
    image_count = sum(1 for item in items if item.kind == "image")
    video_count = sum(1 for item in items if item.kind == "video")
    parts = [
        f"<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Prepared Jades Media</title><style>{css}</style></head><body>",
        "<header><h1>Prepared Jades Media</h1>",
        f"<div class='summary'><span class='pill'>{len(items)} raw files</span><span class='pill'>{image_count} polished images</span><span class='pill'>{video_count} video posters</span><span class='pill'>Originals untouched</span></div>",
        "<p class='note'>This is the prepared review gallery. Images are polished preview files; videos use polished poster frames. Choose cover, gallery, macro, scale/worn and reject items from here.</p></header>",
    ]

    thumb_root = out_dir / "thumbs"
    for group_index, group in enumerate(session_groups(items), 1):
        start = group[0].captured_at.strftime("%H:%M:%S") if group[0].captured_at else "unknown"
        end = group[-1].captured_at.strftime("%H:%M:%S") if group[-1].captured_at else "unknown"
        group_images = sum(1 for item in group if item.kind == "image")
        group_videos = sum(1 for item in group if item.kind == "video")
        parts.append(
            f"<section><h2>Session {group_index}: {start} - {end} · {len(group)} files · {group_images} images · {group_videos} videos</h2><div class='grid'>"
        )
        for item in group:
            thumb_matches = sorted(thumb_root.glob(f"*_{item.stem}.jpg"))
            thumb_src = thumb_matches[0].relative_to(out_dir) if thumb_matches else ""
            if item.kind == "image":
                href = out_dir / "polished_jpg" / f"{item.stem}.jpg"
            else:
                href = out_dir / "video_posters_jpg" / f"{item.stem}.jpg"
            duration = f" · {item.duration:.1f}s" if item.kind == "video" and item.duration else ""
            parts.append(
                f"<article class='card'><a class='thumb' href='{html.escape(str(href))}'>"
                f"{f'<img src=\"{html.escape(str(thumb_src))}\" loading=\"lazy\" alt=\"{html.escape(item.name)}\">' if thumb_src else 'No thumbnail'}"
                f"<span class='badge'>{'VIDEO' if item.kind == 'video' else 'IMG'} #{item.index}</span></a>"
                f"<div class='meta'><div class='name'>{html.escape(item.name)}</div>"
                f"<div class='sub'>Quality {item.quality_score} · {round(item.size_bytes / 1024 / 1024, 2)}MB{duration}</div></div></article>"
            )
        parts.append("</div></section>")
    parts.append("</body></html>")
    (out_dir / "prepared_review.html").write_text("\n".join(parts), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare Chau Ngoc Phuc raw jade media without touching originals.")
    parser.add_argument("--raw", default="/Users/alexzhou/jades")
    parser.add_argument("--out", default="/Users/alexzhou/website_lama/media_prepared/jades")
    parser.add_argument("--skip-images", action="store_true")
    parser.add_argument("--skip-video-posters", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    raw_dir = Path(args.raw)
    out_dir = Path(args.out)
    if not raw_dir.exists():
        raise SystemExit(f"Raw folder not found: {raw_dir}")

    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("ffmpeg and ffprobe are required.")
    if not shutil.which("sips"):
        raise SystemExit("sips is required for AVIF conversion on this Mac.")

    items = inventory(raw_dir)
    burst = burst_groups(items)
    duplicates = visual_candidate_groups(burst)

    # Create thumbnails for reports from polished images when possible, otherwise from raw.
    thumb_dir = out_dir / "thumbs"
    thumb_dir.mkdir(parents=True, exist_ok=True)

    processed = 0
    for item in items:
        if args.limit and processed >= args.limit:
            break

        if item.kind == "image" and not args.skip_images:
            jpg_out = out_dir / "polished_jpg" / f"{item.stem}.jpg"
            avif_out = out_dir / "web_avif" / f"{item.stem}.avif"
            thumb_out = thumb_dir / f"{item.index:04d}_{item.stem}.jpg"
            polish_image(item.path, jpg_out, avif_out, thumb_out, force=args.force)
            processed += 1
            if processed % 30 == 0:
                print(f"Polished {processed} images")
        elif item.kind == "video" and not args.skip_video_posters:
            poster_out = out_dir / "video_posters_jpg" / f"{item.stem}.jpg"
            make_video_poster(item.path, poster_out, force=args.force)
            thumb_out = thumb_dir / f"{item.index:04d}_{item.stem}.jpg"
            if not thumb_out.exists() or args.force:
                run(
                    [
                        "ffmpeg",
                        "-hide_banner",
                        "-loglevel",
                        "error",
                        "-i",
                        str(poster_out),
                        "-vf",
                        "scale=360:360:force_original_aspect_ratio=increase,crop=360:360",
                        "-q:v",
                        "4",
                        "-y",
                        str(thumb_out),
                    ],
                    timeout=20,
                )

    write_reports(out_dir, items, duplicates)
    print(f"Prepared reports in {out_dir}")
    print(f"Duplicate review: {out_dir / 'duplicate_review.html'}")
    print(f"Inventory: {out_dir / 'inventory.csv'}")
    if not args.skip_images:
        print(f"Polished JPGs: {out_dir / 'polished_jpg'}")
        print(f"Website AVIFs: {out_dir / 'web_avif'}")
    if not args.skip_video_posters:
        print(f"Video posters: {out_dir / 'video_posters_jpg'}")


if __name__ == "__main__":
    main()
