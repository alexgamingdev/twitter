/**
 * NEXNET — Firebase Config
 */
export const firebaseConfig = {
  apiKey:            "AIzaSyCz9fehRDGTBC7EQZehiVMNw7jUSSvzku4",
  authDomain:        "socialmedia-71e80.firebaseapp.com",
  projectId:         "socialmedia-71e80",
  storageBucket:     "socialmedia-71e80.firebasestorage.app",
  messagingSenderId: "123307537043",
  appId:             "1:123307537043:web:de892b7015e37d96691366",
  measurementId:     "G-RC2M53VDH9"
};

/**
 * Derives a consistent username + display name from an e-mail address.
 * @param {string} email
 * @returns {{ displayName: string, username: string, avatarInitials: string }}
 */
export function profileFromEmail(email) {
  const displayName    = email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  const username       = "node_" + displayName;
  const avatarInitials = displayName.slice(0, 2).toUpperCase();
  return { displayName, username, avatarInitials };
}

/**
 * Derives profile fields from a Firebase Google user object.
 * Uses the Google display name when available; falls back to the email prefix.
 * A short UID prefix is appended to the generated username to avoid collisions.
 *
 * @param {{ uid: string, displayName: string|null, email: string|null }} user
 * @returns {{ displayName: string, username: string, avatarInitials: string }}
 */
export function profileFromGoogleUser(user) {
  const normalise = s => s.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  const raw  = user.displayName || (user.email || 'user').split('@')[0];
  const base = normalise(raw).slice(0, 20); // cap so the full username stays well within 30 chars
  const username       = 'node_' + base + '_' + user.uid.slice(0, 4);
  const displayName    = user.displayName || raw;
  const avatarInitials = base.slice(0, 2).toUpperCase();
  return { displayName, username, avatarInitials };
}

/**
 * Returns the HTML string for one or more NexNet verification badges.
 *
 * `type` may be a single value or multiple values joined with ';', e.g. 'person;org'.
 * A separate coloured checkmark is rendered for each type:
 *
 *   'person' → blue  checkmark  (verified individual based on notoriety)
 *   'org'    → gold  checkmark  (verified organisation)
 *   'gov'    → grey  checkmark  (government / official state body)
 *
 * If the user was verified directly by an org (verifiedBy contains { name, logo })
 * the org's logo is shown immediately after the checkmarks, just like X's
 * "affiliated" badge behaviour.
 *
 * The returned HTML is safe to inject via innerHTML — content strings are
 * escaped before being embedded in attributes.
 *
 * @param {string|null|undefined} type  One type or semicolon-separated list, e.g. 'person;org'
 * @param {{ name?: string, logo?: string }|null} [verifiedByOrg]
 * @returns {string}
 */
export function verifiedBadgeHtml(type, verifiedByOrg) {
  if (!type) return '';

  const palette = {
    person: { fill: '#1d9bf0', tick: '#ffffff' },
    org:    { fill: '#FFD700', tick: '#050505' },
    gov:    { fill: '#8b98a5', tick: '#ffffff' },
  };

  // Support multiple semicolon-separated types (e.g. 'person;org')
  const types = String(type).split(';').map(t => t.trim()).filter(Boolean);
  if (types.length === 0) return '';

  // Inline SVG checkmark circle — same shape as X's badge
  const svgs = types.map(t => {
    const c = palette[t] || palette.person;
    return (
      `<svg class="verified-check" width="16" height="16" viewBox="0 0 16 16" aria-label="Verified" role="img">` +
        `<circle cx="8" cy="8" r="8" fill="${c.fill}"/>` +
        `<path d="M4.5 8.5l2.3 2.3 4.7-4.6" stroke="${c.tick}" stroke-width="1.7"` +
             ` stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
      `</svg>`
    );
  }).join('');

  let orgImg = '';
  if (verifiedByOrg && verifiedByOrg.logo) {
    // Encode the full URL to prevent attribute injection
    const safeSrc  = encodeURI(String(verifiedByOrg.logo));
    const safeName = (verifiedByOrg.name || '').replace(/[<>"&]/g, (ch) =>
      ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[ch]));
    orgImg =
      `<img class="org-badge-logo" src="${safeSrc}"` +
           ` alt="${safeName}" title="Verified by ${safeName}">`;
  }

  return `<span class="verified-badge-wrap">${svgs}${orgImg}</span>`;
}
