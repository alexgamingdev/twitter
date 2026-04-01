# Old Twitter (Security First)

Dieses Projekt ist eine schnelle, klassische Twitter-artige App mit Firebase als Basis.
Zentrale Prioritaet: Sicherheit und Authentizitaet vor Monetarisierung.

## Features

- E-Mail Login/Registrierung via Firebase Auth
- Echtzeit-Feed mit Firestore
- 3 Verifizierungsstufen ohne Kaufmodell
- Security-First Datenmodell mit Firestore Rules
- Schnelles UI durch leichtes React + Vite Setup

## Verifizierungsstufen

### Stufe 1: Verifizierte Person 🔵
- **Farbe**: Blauer Haken
- **Anforderung**: Authentisches Verhalten, konsequente Aktivitaet
- **Delegationsrechte**: Keine
- **Besonderheiten**: Nur Profil-Badge, keine Zusatzfunktionen

### Stufe 2: Organisation 🟡
- **Farbe**: Goldener Haken
- **Anforderung**: Legitime Organisation mit Nachweisen
- **Delegationsrechte**: 
  - Darf andere als "Verifizierte Person" verifizieren
  - Darf andere als "Organisation" verifizieren
- **Besonderheiten**: 
  - Verifizierte Profile zeigen das Logo der Organisation neben dem Haken
  - Starke Sichtbarkeit durch Farb- und Logo-Kombination

### Stufe 3: Regierung ⚪
- **Farbe**: Grauer Haken
- **Anforderung**: Offizielle Regierungsinstitution
- **Delegationsrechte**: 
  - Darf andere als "Verifizierte Person" verifizieren
  - Darf andere als "Organisation" verifizieren
  - Darf andere als "Regierung" verifizieren (einzig diese Stufe)
- **Besonderheiten**: 
  - Höchste Autorität im System
  - Kann auch Regierungs-Haken vergeben
  - Logo-Branding fuer alle delegierten Personen/Organisationen

## Schnellstart

1. Abhaengigkeiten installieren
- npm install

2. Umgebungsvariablen setzen
- Kopiere .env.example nach .env
- Trage Firebase-Projektwerte ein

3. Entwicklung starten
- npm run dev

4. Production Build erstellen
- npm run build

## Sicherheitsstrategie (wichtig)

Der aktuelle Stand legt die Sicherheitsbasis. Fuer produktiven Einsatz bitte zusaetzlich aktivieren:

- Firebase App Check (Web reCAPTCHA Enterprise)
- MFA fuer sensible Konten
- Cloud Functions fuer serverseitige Rate-Limits
- Device-Risiko-Scoring und Session-Rotation
- ModQueue + Trust Score Pipeline fuer Verifizierungen
- Abuse-Erkennung (Bot-Muster, Burst-Posts, Link-Spam)

## Wichtige Dateien

- src/App.jsx: UI, Auth, Feed-Logik
- src/firebase.js: Firebase Initialisierung
- firestore.rules: Sicherheitsregeln fuer Firestore
- firebase.indexes.json: Indexe fuer Feed-Queries
