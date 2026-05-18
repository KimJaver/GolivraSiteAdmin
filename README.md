# GoLivra Admin

Back-office administrateur GoLivra (marketplace Brazzaville).

## Développement local

```bash
npm install
cp .env.example .env
npm run dev
```

Ouvrir l’URL affichée (souvent `http://localhost:8080`). L’API pointe par défaut vers `https://golivraback.onrender.com`.

## Déploiement Render

1. Pousser ce dépôt sur [GolivraSiteAdmin](https://github.com/KimJaver/GolivraSiteAdmin).
2. Render → **New** → **Static Site** → connecter le repo (ou importer `render.yaml`).
3. Build : `npm ci && npm run build` — dossier publié : `dist` (contient `index.html`).
4. Variable d’environnement (build) : `VITE_PUBLIC_API_BASE_URL=https://golivraback.onrender.com`.
5. Sur le service API **golivraback**, ajouter l’URL du site admin dans `CORS_ORIGINS` (ex. `https://golivra-admin.onrender.com`).

## API backend

- Production : https://golivraback.onrender.com
- Dépôt API : GolivraBack (golivra-backendcd)
