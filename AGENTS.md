# Grandynamic Pty Ltd — Project Operating Contract

## Product and source of truth
Grandynamic Pty Ltd is a customer-first welding and steel-fabrication enquiry PWA for Botswana. The product owner is the final reviewer; the implementer must inspect actual repository state before making changes. GitHub, this file, and the project documentation are the source of truth. Do not carry instructions, identity, Firebase configuration, contacts, or business data over from another project.

## Core customer journey
1. Browse the fabrication catalogue or describe custom work.
2. Build and review a quote request.
3. Submit name, phone, optional email, project location, intended use, dimensions, materials, quantity, services and notes.
4. Receive a truthful confirmation only after Firestore confirms the write.
5. Optionally create an account after submission to keep future enquiries together.
6. Grandynamic reviews the request before any quotation or job is confirmed.

Do not force account creation before an enquiry. Do not describe an enquiry as a confirmed quote, order, or accepted job. If a write fails, preserve the entered details and say the enquiry was not confirmed as saved.

## Firebase and data security
- Use a dedicated Grandynamic Firebase project and its own NEXT_PUBLIC_FIREBASE_* environment variables. Never reuse Africhiko's Firebase project, credentials, customer data or deployment identifiers.
- admins/{uid} is provisioned outside the public client with role owner or staff.
- Public users may read the service catalogue, but only authorized staff may write services.
- Enquiry creation must be authenticated (anonymous auth is allowed), validated, and bound to request.auth.uid via customerId.
- Customers may read only enquiries whose customerId equals their Auth UID. Owner/staff can read the inbox and update only operational fields.
- Never open all Firestore access to work around a permission error. Match rules to the exact collections and fields used by the code.
- Guest-to-Google-account linking must preserve the same anonymous Auth UID where supported. Do not claim automatic merging across unrelated accounts.
- Never commit .env.local, production credentials, service-account JSON or secrets.

## Media and integrations
Inspect the actual implementation and environment before claiming an integration is present. The enquiry form and admin work-feed use the UploadThing client helper and `/api/uploadthing` route for media. `UPLOADTHING_TOKEN` must be configured in the deployment environment and uploads must be tested before claiming production readiness. Do not add Firebase Storage rules or move uploads to Firebase Storage without explicit authorization. Firestore rules and UploadThing configuration are separate concerns.

## PWA installation — protected infrastructure
The approved installation experience in Grandynamic is a permanent reference for all projects. Do not redesign, rewrite, refactor, replace, remove or alter the install mechanism, beforeinstallprompt lifecycle, event listeners, state, dismissible branded card, responsive positioning, manifest, icons or service-worker behaviour unless the product owner explicitly authorizes that specific installation change. For unrelated work, leave installation files untouched. For iOS Safari, describe Share → Add to Home Screen accurately; do not invent support for Chromium's beforeinstallprompt on iOS.

## Enquiry messaging and push notifications
- Customer and staff messages live under `enquiries/{enquiryId}/messages`; preserve the customer ownership boundary and owner/staff role checks in Firestore rules.
- Push device tokens are registered through authenticated server routes and stored server-side under `notificationTokens/{uid}/tokens`; never expose token collections to arbitrary client reads/writes.
- Use Grandynamic Firebase Cloud Messaging only. `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is the public Web Push key; `FIREBASE_ADMIN_KEY` is server-only. Never copy Boemo project credentials, tokens, VAPID keys, or Firebase IDs into Grandynamic.
- Push delivery is best-effort and must not turn a successfully saved enquiry/message/status into a reported failure. Verify live push delivery separately from Firestore persistence.
- The approved installation flow and offline caching are protected. Notification support may be added to `public/sw.js` only additively; do not change PWA registration, install prompt lifecycle, cache namespace, offline routes, or existing fetch/cache behavior for notification work.

## Implementation and verification
- Customer experience first; admin/staff workflows second.
- Preserve working features and keep changes focused.
- Include useful validation, loading, empty, error and success feedback; no dead controls or fake success.
- Before a meaningful checkpoint, run npx tsc --noEmit, npm run lint and npm run build when the environment permits. Report checks that were not run honestly.
- Do not infer production deployment success from a GitHub push or a successful build.
- Never force-push or rewrite history.
- For each checkpoint report repository, branch, commit, changed files, verification, configuration still needed, exact QA steps and deployment status.

## Project identity
Use Grandynamic naming and its own approved project configuration in app-facing text, docs, environment examples and Firebase CLI configuration. Search for and correct inherited identity leaks rather than copying another project's details.

## Admin access and work feed
- Grandynamic admin access is restricted to `chikohoraknowledge4@gmail.com` and `gatshaayanda@gmail.com`. The admin UI uses Firebase Google sign-in; never use a shared access word, typed admin password form, or anonymous session to grant admin privileges.
- The server route verifies the Firebase ID token and allowlisted email before provisioning the role. It requires server-only `FIREBASE_ADMIN_KEY` service-account JSON. Google sign-in must be enabled in Firebase Authentication, and both allowlisted Google accounts must be able to authenticate with their exact allowlisted email addresses.
- Firestore rules independently enforce the same email allowlist as well as the owner/staff role. Keep the allowlist synchronized across routes, notification endpoints, and rules.
- Push notifications are best-effort; a successful FCM send response is not proof of device display. Keep permission-denied recovery instructions explicit and preserve the approved service-worker install/cache behavior.
- Work-feed items live in `workFeed`; only published items are public. Interest signals are deduplicated per UID in `workInterests`, and customer identities must never be displayed publicly.
- Preserve the approved PWA installation mechanism and UX during unrelated work.


## Grandynamic identity reset — pending owner configuration

- The current repository includes the approved native install flow, dismissible install card, embedded-browser gate, iOS guidance and service-worker lifecycle. No chatbot component exists in this repository; do not claim one is present or invent a replacement. If a chatbot is requested, first locate an approved implementation and preserve its interaction contract. Only identity, presentation and project-specific copy may change without explicit authorization.
- Before production, configure the dedicated Grandynamic Firebase project and confirm the business owner’s authorized Google account(s), contact details and workshop address. The current code/rules allowlist is limited to `gatshaayanda@gmail.com` as a temporary bootstrap account; update client, server and Firestore allowlists together after the business owner confirms their account.
- Never reuse Africhiko production credentials, customer data or deployment identifiers.
- Keep the existing customer enquiry/account journey and admin CRUD intact; no enquiry is a confirmed quote until the workshop reviews it.


## Account experience and contextual guidance
- Treat customer and admin accounts as a cohesive product experience, not repeated sign-in forms. Reuse the existing Firebase Auth session and current account workflows; never introduce a second account system or duplicate enquiry data.
- Admin session restoration: when Operations opens, inspect the existing Firebase auth session and verify it with the server-side `/api/admin/access` endpoint before granting access. A remembered Google login alone is never proof of admin authorization. Preserve the server verification and approved email/role checks.
- Avoid forcing Google's account chooser on every sign-in unless the user explicitly asks to switch accounts. Offer a clear sign-out/switch-account path.
- Admin sessions must expire after 24 hours. Enforce expiry on entry and while the Operations session remains open; sign out when expired. Do not weaken server-side authorization or Firestore rules to make returning sessions easier.
- Greetings may use a verified customer's preferred first name once at an appropriate entry point. Admin greetings may use a warm, concise tone (for example, “Morning, Boss”) if it fits the brand. Use neutral fallbacks when a name or local time is unavailable.
- Personalization must be truthful: enquiry counts, statuses, messages and progress must come from current authorized records. Never invent names, unread counts, job updates or activity to make the interface feel lively.
- The contextual helper/chat widget must remain honest about being a guided helper unless a real AI service is configured. Prefer short, dismissible, page-relevant quick actions that navigate to existing flows (start an enquiry, view the signed-in customer's own enquiries, review the authorized admin inbox, update services, or publish completed work). Actions must work; never claim an enquiry/message was sent unless persistence succeeded. Keep the protected chatbot's existing core behaviour; any future adaptation requires preserving its interaction contract and branding/copy-only changes unless explicitly authorized.
- Weather is optional and secondary, not a decorative dashboard requirement. Add it only where it helps a real outdoor installation/site visit; use an actual forecast, named town/project location supplied by the user, and a visible update time. Do not silently track precise location or fabricate conditions. If live weather is unavailable, omit the weather card.
- Account UX improvements must be implemented and verified as a focused change, separately from branding/media cleanup. Preserve existing guest enquiry access, guest-to-Google linking where supported, ownership boundaries, notification behaviour and the PWA installation flow.

## Branding and media hygiene
- Remove inherited Africhiko/Namane Tyres identity and bundled demo footage from Grandynamic's public-facing experience. Prefer original, locally stored SVG illustrations or properly licensed imagery over unrelated stock clips or remote hot-linked assets.
- Keep customer landing-page and catalogue content relevant to welding, fabrication, gates, repairs and steel structures. Do not add retail checkout, payment or car-wash flows.
- Keep the admin entry point discoverable in the footer; customer account and enquiry actions must remain understandable and accessible on mobile.
- Never edit installation event handling, install prompt UI/lifecycle, PWA registration or service-worker caching as part of ordinary branding/media work. Only replace install branding/assets when needed and preserve the installation behaviour exactly.
