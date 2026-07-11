# Tooling Record

Last verified: 2026-07-01

## Codex Skills

- `ui-ux-pro-max`
  - Status: installed.
  - Path: `/Users/alexzhou/.codex/skills/ui-ux-pro-max/SKILL.md`
  - Purpose: UI/UX design guidance, design-system recommendations, accessibility, layout, typography, animation, responsive quality checks, and stack-specific guidance.
  - Note: For future UI or design changes on Châu Ngọc Phúc, read this skill first when design quality, layout, animation, or UX is involved.

## Project Animation Packages

- `animejs`
  - Status: installed in this website project.
  - Version: `4.5.0`
  - Location: `/Users/alexzhou/website_lama/package.json`
  - Purpose: DOM/SVG/UI animation helpers for reveal effects, staggered motion, micro-interactions, and lightweight animation polish.
  - Note: This is an npm package, not a Codex skill in the current environment.

- `three`
  - Status: installed in this website project.
  - Version: `0.185.0`
  - Location: `/Users/alexzhou/website_lama/package.json`
  - Purpose: WebGL/3D rendering. Currently available, but realistic jewelry depth effects should use real image/video/model assets instead of fake code-generated objects.

## Verification Commands

```bash
test -f /Users/alexzhou/.codex/skills/ui-ux-pro-max/SKILL.md
npm ls animejs --depth=0
npm ls three --depth=0
```

## Important Clarification

The requested Anime tool from `juliangarnier/anime.git` is represented here as the installed `animejs` npm dependency. There is no separate `anime` Codex skill installed under `/Users/alexzhou/.codex/skills` at the time of this verification.
