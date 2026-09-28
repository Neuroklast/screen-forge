# Validation / 2026-09-28

- TypeScript check and Vite production build passed.
- 4 unit tests passed: countdown boundaries, seeded readings, preset round-trip and invalid presets.
- 5 Chromium browser tests passed: all scenes and transport, prepared terminal input/export/persistence, countdown completion/reset, synthetic multitouch including cancellation, mobile layout and rejected preset imports.
- Studio and scene screenshots inspected. Hologram footer overlap and missing tracking thumbnail glyph corrected.
- Browser tests used a local Chromium binary via CHROMIUM_PATH. CI uses Playwright-managed Chromium.
- Windows batch files not executed on Windows. Physical multitouch, GPU frame times and camera capture not validated.
- No GitHub remote created. Local repository and commit are included.

## Corporate design revision

Production build passed. Reviewed studio, clean-stage and warning screenshots. Personnel search still filters records. At native stage resolution, main content ends at y=690 and the footer begins at y=713. Only corporate-scoped styling, its mark, fonts and preset accent were changed. Other scene styles were left unchanged.
