Neon Arcade — local dev scaffold

This repo is a static arcade website with playable games, Supabase auth/chat integration, and score leaderboards.

Supabase integration

The project now uses Supabase for authentication, realtime chat, and leaderboard persistence. If Supabase is not configured, the app falls back to localStorage for demo mode.

To enable Supabase:

1. Create a Supabase project at https://app.supabase.com
2. In the project settings, find the project URL and anon/public API key.
3. Edit `js/supabase-config.js` and paste your values:

```js
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
```

4. Run the SQL in `supabase-schema.sql` in the Supabase SQL editor to create the required tables and Row Level Security policies.

The schema includes:
- `user_profiles` for storing username/color data tied to `auth.users.id`
- `themessages` augmented with `user_id` and `color`
- `tetris_scores` for Tetris leaderboards
- `pacman_scores` for Pac-Man leaderboards
- `snake_scores` for Snake leaderboards (optional future Supabase support)

Security and RLS

The provided SQL enables Row Level Security and adds policies so that:
- anyone can read chat and score tables
- authenticated users can insert rows only for their own `auth.uid()`
- users can delete their own rows

For production, do not expose the Supabase service_role key in client code. The browser should only use the `anon` key.

Development

This is a static site — open `index.html` in a browser or serve with a static server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

Games included

- Tetris with touch controls and score submission
- Snake
- Pac-Man
- Chat with Supabase realtime support
- FPS prototype stub
- 3D F1 prototype stub

Next steps

1. Run `supabase-schema.sql` in Supabase.
2. Sign up and save your profile in `auth.html`.
3. Play games and verify chat/leaderboards.
4. I can continue by polishing Tetris, improving the FPS prototype, and adding a better 3D F1 experience.
