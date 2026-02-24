# Publishing Administration - MVP Demo

Full-flow demo of the publishing data capture feature for music distribution platforms.

**Live demo:** https://djfnd.github.io/publishing-mvp-demo/

## Demo Flow

1. **Profile Setup** - Capture songwriter details (name, IPI, PRO, publisher)
2. **Release View** - Mock distribution showing a release with tracks
3. **Publishing Capture** - Add publishing metadata per-track or bulk
4. **Export** - View submitted data and download CSV for works registration

## Features Demonstrated

- Songwriter profile capture with IPI validation (9-11 digits)
- Release/track view with publishing status indicators
- Bulk flow: "Same writers for all tracks" shortcut
- Per-track publishing capture
- Co-writer management with split validation (must total 100%)
- Sole writer validation (catches <100% split errors)
- Sample/interpolation flagging
- CSV export with alt titles and full writer details
- ISWC assignment messaging

## Test Data

The demo includes a mock release "Mediterranean Dreams EP" with 4 tracks. Two tracks have alt titles (Spanish translations) to demonstrate alt title export.

## Local Development

```bash
npm install
npm run dev
```

## Deployment

Automatically deploys to GitHub Pages via GitHub Actions on push to `main`.

## Note

This is a standalone demo with mock data. The real implementation would integrate with the platform's distribution and user account systems.
