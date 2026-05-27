# Deployment Guide

This guide explains how to deploy CragTrails to production (Vercel recommended) and keep it running smoothly.

## Recommended: One-Click Deploy to Vercel

The fastest way to get a live version:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKolinCunningham%2Fcragtrails)

After clicking:
1. Vercel will automatically fork the repo and start building.
2. In ~1-2 minutes you'll get a public URL like `https://cragtrails-abc123.vercel.app`.
3. Update this README with your new live URL and commit.

**Current official live site:** https://cragtrails.vercel.app

## Manual Deployment (Vercel CLI)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link the project (first time only)
vercel link

# 4. Deploy
vercel --prod
```

## Environment Variables

CragTrails is designed to work with zero environment variables for the basic demo.

For future features you will likely need:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Your production domain (e.g. `https://cragtrails.app`) | Recommended |
| `DATABASE_URL` | Postgres connection string (for real user data) | Future |
| `CLERK_SECRET_KEY` | Clerk authentication secret | Future (auth) |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Future (auth) |

Add these in the Vercel dashboard under **Settings → Environment Variables**.

## Custom Domain

1. Go to your Vercel project → **Settings → Domains**
2. Add your domain (e.g. `cragtrails.app` or `app.cragtrails.app`)
3. Follow Vercel's DNS instructions (usually just add a `CNAME` record)

## Updating the Live URL in README

After you deploy, edit the following line in `README.md`:

```markdown
**Current recommended live link** (update this after you deploy):
→ [Your Live CragTrails](https://your-actual-url.vercel.app)
```

Then commit and push.

## Preview Deployments

Every pull request automatically gets a unique preview URL from Vercel. This is extremely useful for testing changes before merging.

## Troubleshooting

**Build fails?**
- Make sure you're on the latest `main` branch
- Run `npm run build` locally first to see errors

**Images not loading?**
- We use `picsum.photos` for demo images (they are public)

**Want to connect a real database?**
See the "Next Steps" section in the main README.

## Questions?

Open an issue or follow the Skeptical CEO contribution process in `CONTRIBUTING.md`.

---

**Maintained with ❤️ by the CragTrails team** (and a bunch of skeptical AI agents).