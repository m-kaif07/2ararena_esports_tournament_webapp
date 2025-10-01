# ARArena — Free Fire Tournament Website

**Tech Stack**: Node.js v18 + Express, SQLite (single-file), Frontend in HTML/CSS/JS (no template engines).  
**Auth**: JWT (stored in localStorage) + bcryptjs (password hashing).

## Notes
- **Room ID / Password** are visible only to **registered players** starting **5 minutes** before the match start time.
- **Slots**: Solo=48, Duo=24, Squad=12 (server auto-assigns based on mode). Slots can be different as well, depending on the type of game/tournament.
- **Slot tracking** updates via polling on the tournaments page.
- **PhonePe Number** is collected on registration and stored per registration.
- **Razorpay** placeholder is indicated in the UI for future integration.

## Troubleshooting
- If you previously saw `Error: secretOrPrivateKey must have a value`, it’s fixed here by setting a default. You can still override with `.env`.
- If images don't show, ensure the server has write access to `public/uploads` and that you're using the provided `npm start`.
```
