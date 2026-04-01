# NexNet — Firebase Setup Guide

This guide explains how to configure the Firebase project for NexNet from scratch.
Follow every step to avoid the **"Authentication service is not configured"** error.

---

## 1. Create / Open the Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Open the project **`socialmedia-71e80`** (or create a new project and update
   the credentials in `js/firebase-config.js` accordingly).

---

## 2. Enable Firebase Authentication ⚠️ (required to fix the auth error)

This is the step most commonly missed, and it causes the
`auth/configuration-not-found` error which displays as
*"Authentication is temporarily unavailable. Please try again later or contact support."*

### Enable Email/Password sign-in

1. In the Firebase Console sidebar click **Build → Authentication**.
2. Click **Get started** (only shown the first time).
3. Go to the **Sign-in method** tab.
4. Click **Email/Password**, toggle **Enable**, then click **Save**.

Without this provider enabled, login and registration will fail.

---

## 3. Add Authorised Domains

1. Still in **Authentication**, open the **Settings** tab.
2. Under **Authorised domains** add your production domain, e.g.:
   ```
   nexnet.alexgamingdev.tech
   ```
   (`localhost` and the default `*.firebaseapp.com` domain are pre-authorised.)

---

## 4. Deploy Firestore Rules

Paste the rules below into **Build → Firestore Database → Rules**, or deploy
them with the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ─── Messages (public feed) ──────────────────────────────────────────────
    // Anyone can read and create messages.
    // Updates are restricted to the likes counter only.
    // Authors may delete their own messages.
    match /messages/{id} {
      allow read, create: if true;
      allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes']);
      allow delete: if request.auth != null && resource.data.authorUid == request.auth.uid;
    }

    // ─── Users ───────────────────────────────────────────────────────────────
    // Public read-only.
    // Authenticated users may create their own profile document (registration).
    // Profile owners may update their own document, but may not change any
    // verification fields (verified, verifiedType, verifiedBy, canVerify).
    // Verification fields may be updated by the admin portal — restricted to
    // those three fields only (admin portal does not use Firebase Auth, so
    // request.auth is null for that code path).
    //
    // Fields editable by profile owner:
    //   username, displayName, bio, avatarUrl, bannerUrl, avatarInitials,
    //   location, website, email
    // Fields editable by admin only (no auth required = admin portal works):
    //   verified      (bool)
    //   verifiedType  ('person' | 'org' | 'gov')
    //   verifiedBy    ({ uid, name, logo } | null)
    //   canVerify     (bool)
    //   followersCount, followingCount (number)
    match /users/{userId} {
      allow read: if true;
      // Registration: a new user may create their own profile document.
      allow create: if request.auth != null && request.auth.uid == userId;
      // Profile owner: may update any fields except verification/admin fields.
      // Admin portal: may update only verification fields (no auth required).
      allow update: if (
        request.auth != null && request.auth.uid == userId &&
        !request.resource.data.diff(resource.data).affectedKeys()
            .hasAny(['verified', 'verifiedType', 'verifiedBy', 'canVerify',
                     'followersCount', 'followingCount'])
      ) || (
        request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['verified', 'verifiedType', 'verifiedBy'])
      );
    }

    // ─── Verification Requests ────────────────────────────────────────────────
    // Anyone can submit a verification request (create).
    // The admin portal reads all pending requests and deletes them on
    // accept / reject.
    match /verification_requests/{id} {
      allow read:   if true;
      allow create: if true;
      allow delete: if true;
    }

    // ─── Org-Issued Verifications ─────────────────────────────────────────────
    // Verified organisations (canVerify == true) and government/org-verified
    // accounts can directly grant verification to other users.
    match /org_verifications/{id} {
      allow read: if true;
      allow create: if request.auth != null
        && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.canVerify == true
            || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.verifiedType in ['org', 'gov'])
        && request.resource.data.issuedByUid == request.auth.uid;
      allow update, delete: if false;
    }

    // ─── Post Likes ───────────────────────────────────────────────────────────
    // Tracks per-user likes (document ID = {postId}_{uid}).
    // Enforces one vote per user per post: a user may only create/delete
    // their own like document.
    match /post_likes/{likeId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid;
      allow delete: if request.auth != null
        && resource.data.uid == request.auth.uid;
    }

    // ─── Follows ─────────────────────────────────────────────────────────────
    // Document ID = {followerUid}__{followedUid}
    // Authenticated users can follow/unfollow; everyone can read follow counts.
    match /follows/{id} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.followerUid == request.auth.uid;
      allow delete: if request.auth != null
        && resource.data.followerUid == request.auth.uid;
    }

    // ─── Notifications ────────────────────────────────────────────────────────
    // Each user has their own sub-collection; only they can read their own.
    // Writes are handled by backend/admin only (Cloud Functions).
    match /notifications/{userId}/items/{itemId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }

  }
}
```

---

## 5. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

The index definitions live in `firestore.indexes.json`.

---

## 6. Deploy Hosting

```bash
firebase deploy --only hosting
```

Or deploy everything at once:

```bash
firebase deploy
```

---

## 7. Update `js/firebase-config.js` (if using a different project)

Replace the values with those found in your Firebase project's **Project settings
→ General → Your apps → SDK setup and configuration**:

```js
export const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
  measurementId:     "YOUR_MEASUREMENT_ID"   // optional
};
```

---

## Quick Checklist

- [ ] Firebase Authentication **Email/Password** provider is **enabled**
- [ ] Production domain added to **Authorised domains**
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] `js/firebase-config.js` contains the correct project credentials

