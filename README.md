# LIFE, BY DESIGN

A cozy, responsive lifestyle-planning and room-decorating game prototype.

**Your life. Your choices. Your world.**

## Run it

Open `index.html` in a modern browser. No build step or package installation is required. You can also serve the repository with any static file server.

## Included in this prototype

- Home dashboard with daily activities and upcoming plans
- My Life planner with custom plans, goals, and a private-by-default journal
- Changeable life categories—no prescribed milestones or single path
- LIFE COINS earned from participation, with a configurable-in-code daily cap
- Cozy illustrated room and virtual decor shop
- Sample reward ideas and a visible warning that demo redemptions are not real vouchers
- Responsive layout for desktop and mobile
- Browser-local persistence using `localStorage`

## Important prototype limitations

This is a front-end demo, not a production service. Data lives only in the current browser and is not synced or backed up. There is no authentication, server-side coin validation, real voucher, payment system, brand dashboard, admin dashboard, or secure account deletion. Do not enter sensitive personal or financial information. Coin validation, transaction integrity, privacy controls, and reward fulfillment must be implemented server-side before launch.

## Project structure

```text
.
├── index.html   # App shell and navigation
├── styles.css   # Responsive cozy-game visual design
├── app.js       # Views, browser-local state, planning and game interactions
└── README.md    # Setup and prototype notes
```

## Suggested next steps

1. Test the prototype with target users and learn which planning and room features feel valuable.
2. Replace emoji placeholders with original illustrated assets.
3. Move accounts, private data, goals, and the coin ledger to a secure backend with server-side authorization and validation.
4. Add consent-aware, aggregated campaign analytics and real voucher fulfillment only after partner and legal review.
5. Validate Indonesian pricing and regulations before introducing subscriptions or real-money transactions.

---

## Added: web demo and mobile game prototype

- `demo/index.html` - single-page planner demo (Home, My Life, My World, Rewards, Profile). Open in a browser. Data is saved in local storage only.
- `prototype/` - six-screen clickable mobile game prototype (Main, Home, Quests, Decorate, Bazaar, Shop). These are Claude Design artboards (`.dc.html` + `canvas.json`) and need the Design artifact runtime to render.

Notes on the prototype: all content, brands and rewards are sample data; coins cannot be cashed out or bought; visuals are placeholder code-drawn art, so final illustrated assets (character, rooms, furniture, icons) are still needed; each screen keeps its own state, so coins are not shared between screens.
