# GitHub Pages Deployment

Diese App ist eine static site und kann direkt mit GitHub Pages gehostet werden.

## Setup für GitHub Pages

### Option 1: Automatisches Deployment mit GitHub Actions (Empfohlen)

1. **Repository zu GitHub pushen**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/dein-username/twitter.git
git push -u origin main
```

2. **GitHub Pages aktivieren**
   - Gehe zu deinem Repository → Settings → Pages
   - Unter "Source" wähle: "GitHub Actions"
   - Der `.github/workflows/deploy.yml` wird automatisch triggern

3. **Fertig!** Deine App ist jetzt unter `https://dein-username.github.io/twitter` erreichbar.

### Option 2: Manuelles Deployment

1. **Build erstellen**
```bash
npm run build
```

2. **`dist/` folder zum `gh-pages` branch pushen**
```bash
git subtree push --prefix dist origin gh-pages
```

3. **GitHub Pages aktivieren** (siehe oben)

## Wichtig für Firebase

Deine Firebase-Credentials sind in `.env` - diese Datei ist im `.gitignore`, wird also nicht gepusht. 

**Für production:**
1. Environment Variables in GitHub Actions setzen:
   - Gehe zu Settings → Secrets and variables → Actions
   - Füge deine Firebase-Keys ein: `VITE_FIREBASE_API_KEY`, etc.

2. Update `deploy.yml`:
```yaml
      - name: Build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          # ... alle anderen keys
        run: npm run build
```

## Testing

```bash
# Dev Server
npm run dev

# Production Build lokal testen
npm run build
npm run preview
```

Dann öffnest du `http://localhost:4173` im Browser - das ist exakt wie deine GitHub Pages aussieht.
