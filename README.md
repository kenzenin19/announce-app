# Day 1 starter files

These files go on top of a fresh Next.js project. Do these steps in order.

1. Create the app and install packages:

```bash
npx create-next-app@latest announce-app --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
cd announce-app
npm i @supabase/supabase-js @supabase/ssr
npx shadcn@latest init
npx shadcn@latest add button input label card
```

2. Copy everything from this zip into the `announce-app` folder, merging folders.
   Say **yes** to overwrite `app/page.tsx`.
   Do not copy this README or the `supabase` folder into the app if you don't want to; they are just for reference.

3. Rename `.env.local.example` to `.env.local` and fill in your two Supabase values
   (Supabase > Project Settings > API).

4. In Supabase > SQL Editor, run `supabase/day1-schema.sql` **before** signing up.

5. In Supabase > Authentication > Providers > Email, turn OFF "Confirm email" for now.

6. Run it:

```bash
npm run dev
```

7. Sign up at http://localhost:3000, then make yourself admin with the commented
   SQL at the bottom of `day1-schema.sql`.

8. Push to GitHub, import the repo in Vercel, add the same two env vars, deploy,
   then set Supabase > Authentication > URL Configuration (Site URL = your Vercel URL,
   Redirect URLs include `http://localhost:3000/**` and `https://YOUR-APP.vercel.app/**`).

Next.js 16 note: rename `middleware.ts` to `proxy.ts` and the function to `proxy`.
