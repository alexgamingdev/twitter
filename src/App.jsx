import { useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import './App.css'

const VERIFICATION_TYPES = {
  person: {
    tier: 1,
    label: 'Verifizierte Person',
    badge: '✓',
    color: '#1d9bf0',
    canDelegate: false,
    description: 'Authentische Person, verifiziert durch Authentizitaet',
  },
  organization: {
    tier: 2,
    label: 'Organisation',
    badge: '✓',
    color: '#ffd700',
    canDelegate: true,
    description: 'Kann andere Nutzer als Person oder Organisation verifizieren',
  },
  government: {
    tier: 3,
    label: 'Regierung',
    badge: '✓',
    color: '#8c92ac',
    canDelegate: true,
    canDelegateGov: true,
    description: 'Kann andere als Person, Organisation oder Regierung verifizieren',
  },
}

const seedProfiles = [
  {
    name: 'Alex Verified',
    handle: 'alexverified',
    verifyType: 'person',
    issuedBy: null,
    orgLogo: null,
  },
  {
    name: 'TechCorp',
    handle: 'techcorp',
    verifyType: 'organization',
    issuedBy: null,
    orgLogo: '🏢',
  },
  {
    name: 'Bundesregierung',
    handle: 'de_government',
    verifyType: 'government',
    issuedBy: null,
    orgLogo: '🏛️',
  },
]

function VerificationBadge({ verifyType, orgLogo }) {
  const typeData = VERIFICATION_TYPES[verifyType] || VERIFICATION_TYPES.person
  return (
    <span
      className="verification-badge"
      style={{ backgroundColor: typeData.color }}
      title={typeData.label}
    >
      {typeData.badge}
      {orgLogo && <span className="org-logo">{orgLogo}</span>}
    </span>
  )
}

function App() {
  const [mode, setMode] = useState('login')
  const [authUser, setAuthUser] = useState(null)
  const [mail, setMail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loadingAuth, setLoadingAuth] = useState(false)
  const [loadingSession, setLoadingSession] = useState(true)
  const [postText, setPostText] = useState('')
  const [posting, setPosting] = useState(false)
  const [feed, setFeed] = useState([])

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user)
      setLoadingSession(false)
    })

    const feedQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(60))
    const unsubFeed = onSnapshot(feedQuery, (snapshot) => {
      const docs = snapshot.docs.map((docRef) => ({ id: docRef.id, ...docRef.data() }))
      setFeed(docs)
    })

    return () => {
      unsubAuth()
      unsubFeed()
    }
  }, [])

  const [profileVerifyType, setProfileVerifyType] = useState('person')
  const [profileOrgLogo, setProfileOrgLogo] = useState(null)
  const [userProfiles, setUserProfiles] = useState({})
  const [delegationPanel, setDelegationPanel] = useState(false)
  const [delegateEmail, setDelegateEmail] = useState('')
  const [delegateType, setDelegateType] = useState('person')
  const [delegatingOrgLogo, setDelegatingOrgLogo] = useState('')

  useEffect(() => {
    if (!authUser) {
      setProfileVerifyType('person')
      setProfileOrgLogo(null)
      return
    }
    const createdAt = authUser.metadata?.creationTime
    if (!createdAt) {
      setProfileVerifyType('person')
      return
    }

    const ageInDays = Math.floor(
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
    )

    if (ageInDays < 7) {
      setProfileVerifyType('person')
    }
  }, [authUser])

  const handleAuth = async (event) => {
    event.preventDefault()
    setAuthError('')
    setLoadingAuth(true)

    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, mail, password)
      } else {
        await signInWithEmailAndPassword(auth, mail, password)
      }
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setLoadingAuth(false)
    }
  }

  const handlePost = async () => {
    if (!authUser || !postText.trim()) {
      return
    }

    setPosting(true)
    try {
      await addDoc(collection(db, 'posts'), {
        text: postText.trim(),
        createdAt: serverTimestamp(),
        uid: authUser.uid,
        author: authUser.email?.split('@')[0] ?? 'member',
        verifyType: profileVerifyType,
        issuedBy: null,
        orgLogo: profileOrgLogo,
      })
      setPostText('')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setPosting(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
  }

  return (
    <main className="shell">
      <aside className="left-panel">
        <h1 className="brand">twitter</h1>
        <p className="tagline">Fast feed, starke Sicherheit, authentische Profile.</p>
        {fbError && (
          <div className="firebase-error">
            <p><strong>⚠️ Firebase nicht konfiguriert</strong></p>
            <small>Bitte `.env` mit Firebase-Credentials ausfüllen.</small>
          </div>
        )}
        <div className="levels-box">
          <h2>Verifizierungsstufen</h2>
          <ul>
            {Object.entries(VERIFICATION_TYPES).map(([key, value]) => (
              <li key={key}>
                <span className="level-row">
                  <VerificationBadge verifyType={key} /> {value.label}
                </span>
                <small>{value.description}</small>
              </li>
            ))}
          </ul>
          <p className="policy-note">Keine Kaeufe. Nur Authentizitaet und Verhalten.</p>
        </div>
      </aside>

      <section className="timeline">
        <header className="timeline-header">
          <h2>Home</h2>
          {authUser ? (
            <button className="ghost-btn" onClick={handleLogout}>Abmelden</button>
          ) : null}
        </header>

        {loadingSession ? <p className="status">Lade Session...</p> : null}

        {!authUser ? (
          <form className="auth-card" onSubmit={handleAuth}>
            <h3>{mode === 'register' ? 'Konto erstellen' : 'Anmelden'}</h3>
            <input
              type="email"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              placeholder="E-Mail"
              required
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              required
              minLength={10}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
            <button type="submit" disabled={loadingAuth}>
              {loadingAuth ? 'Bitte warten...' : mode === 'register' ? 'Registrieren' : 'Einloggen'}
            </button>
            <p className="switch-line">
              {mode === 'register' ? 'Schon dabei?' : 'Neu hier?'}{' '}
              <button
                type="button"
                className="inline-btn"
                onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
              >
                {mode === 'register' ? 'Jetzt einloggen' : 'Konto erstellen'}
              </button>
            </p>
            {authError ? <p className="error">{authError}</p> : null}
          </form>
        ) : (
          <>
            <article className="composer">
              <div className="composer-head">
                <p>
                  @{authUser.email?.split('@')[0]}
                  <VerificationBadge verifyType={profileVerifyType} orgLogo={profileOrgLogo} />
                </p>
                <small>Anti-Bot Regeln aktiv: Textlimit, Session Checks, Rate-Limits serverseitig</small>
                {VERIFICATION_TYPES[profileVerifyType]?.canDelegate && (
                  <button 
                    className="delegate-btn" 
                    onClick={() => setDelegationPanel(!delegationPanel)}
                  >
                    ➕ Verifizieren
                  </button>
                )}
              </div>
              {delegationPanel && (
                <div className="delegation-form">
                  <h4>Nutzer verifizieren</h4>
                  <input
                    type="email"
                    value={delegateEmail}
                    onChange={(e) => setDelegateEmail(e.target.value)}
                    placeholder="E-Mail des Nutzers"
                  />
                  <select value={delegateType} onChange={(e) => setDelegateType(e.target.value)}>
                    <option value="person">Verifizierte Person</option>
                    {profileVerifyType === 'organization' && (
                      <option value="organization">Organisation</option>
                    )}
                    {profileVerifyType === 'government' && (
                      <>
                        <option value="organization">Organisation</option>
                        <option value="government">Regierung</option>
                      </>
                    )}
                  </select>
                  {delegateType !== 'person' && (
                    <input
                      type="text"
                      value={delegatingOrgLogo}
                      onChange={(e) => setDelegatingOrgLogo(e.target.value)}
                      placeholder="Logo Emoji (z.B. 🏢)"
                      maxLength="2"
                    />
                  )}
                  <button className="submit-verify-btn" onClick={() => {
                    alert(`Verifizierungsanfrage an ${delegateEmail} als ${delegateType} (in Produktion: serverseitig verarbeitet)`);
                    setDelegateEmail('');
                    setDelegateType('person');
                    setDelegatingOrgLogo('');
                  }}>Absenden</button>
                </div>
              )}
              <textarea
                maxLength={280}
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="Was passiert gerade?"
              />
              <div className="composer-foot">
                <span>{280 - postText.length} Zeichen</span>
                <button onClick={handlePost} disabled={!postText.trim() || posting}>
                  {posting ? 'Sende...' : 'Tweeten'}
                </button>
              </div>
            </article>

            <section className="feed-list">
              {feed.map((post) => (
                <article key={post.id} className="tweet-card">
                  <div className="tweet-top">
                    <strong>@{post.author}</strong>
                    <VerificationBadge verifyType={post.verifyType || 'person'} orgLogo={post.orgLogo} />
                  </div>
                  <p>{post.text}</p>
                </article>
              ))}
              {!feed.length ? <p className="status">Noch keine Tweets vorhanden.</p> : null}
            </section>
          </>
        )}
      </section>

      <aside className="right-panel">
        <h3>Authentizitaets-Lab</h3>
        <p>
          Ziel ist maximale Bot-Resistenz durch App Check, Device-Fingerprints,
          Risiko-Scores, Moderation und manuelle Pruefungen.
        </p>
        <h4>Beispielprofile</h4>
        <ul>
          {seedProfiles.map((profile) => (
            <li key={profile.handle}>
              <span>
                {profile.name} @{profile.handle}
              </span>
              <VerificationBadge verifyType={profile.verifyType} orgLogo={profile.orgLogo} />
            </li>
          ))}
        </ul>
      </aside>
    </main>
  )
}

export default App
