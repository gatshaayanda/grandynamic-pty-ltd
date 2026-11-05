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
- Grandynamic admin access is restricted to `chikohoraknowledge4@gmail.com` and `gatshaayanda@gmail.com`. The admin entry UI uses the single word `admin` as its concise entry point, matching the approved John the Stylist pattern. This word is a UI/navigation gate only, not a password or credential. The button must continue into Firebase Google sign-in, and the server must verify the ID token, allowlisted email and `admins/{uid}` owner/staff role before granting access. Never treat the word `admin`, a typed display name, or an anonymous session as authentication.
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


## Workshop queue and customer project sharing
- The authorized Operations dashboard links to `/admin/workshop`, the Grandynamic Workshop Queue. Staff may register a walk-in, phone/WhatsApp customer or an existing-enquiry project, then update its status and customer-facing progress.
- Workshop records are stored server-side in `workshopJobs/{jobId}`; public-safe project snapshots live in `publicProjects/{randomShareId}`. Do not expose the private job record or customer phone number through public endpoints.
- Only server routes using Firebase Admin SDK may read/write workshop job records. `/api/workshop/jobs` requires a verified Firebase ID token, the existing Grandynamic email allowlist and an `admins/{uid}` owner/staff role. Do not loosen the existing admin rules or expose these collections to browser clients.
- Customer links use cryptographically random 40-character hexadecimal share IDs at `/project/{shareId}`. Anyone with that link can see the explicitly public project description, status, customer-facing updates, optional owner-entered estimate and message thread. Treat the link as private; do not put personal contact details, quotation amounts, payment state or internal notes in the public snapshot.
- Customers may send project messages without creating an account. Workshop replies require verified Operations authorization. Messages are stored below `publicProjects/{shareId}/messages`; do not treat a typed name or access to the link as verified account ownership.
- The workshop queue is FIFO for active jobs; completed/cancelled jobs appear after active work. Wait estimates are optional and must be entered by the owner/staff only when realistic. Never fabricate an ETA or claim that WhatsApp messages were sent automatically: sharing opens a prefilled WhatsApp conversation for the staff member to review and send.
- Status updates and customer-facing messages are persisted before success is shown. Keep internal notes private. Preserve the existing enquiry, quote basket, customer account, work feed, UploadThing media, PWA installation and service-worker behavior when extending the workshop workflow.
- Public project endpoints: `GET /api/workshop/share/{shareId}` and `GET/POST /api/workshop/share/{shareId}/messages`. Staff endpoints: `GET/POST/PATCH /api/workshop/jobs` and `GET/POST /api/workshop/messages`. Do not add public Firestore read/write rules as a shortcut; these routes use the server Admin SDK.

- Workshop progress images are uploaded through the existing Grandynamic UploadThing `fileUploader` route (maximum 4 MB per image, up to 12 retained per project). Only the image URL, caption and timestamp are copied into the public-safe project snapshot; keep internal notes and phone details private. Do not introduce Firebase Storage or new storage rules for this feature.

## Visible work, loading and operational transparency

- Every meaningful asynchronous action must show its actual state: idle, working, success or failure. Use action-specific busy states so unrelated controls remain usable; prevent duplicate submissions while a write is in flight.
- Prefer compact skeletons or stable placeholders for delayed content. Distinguish loading, empty, stale/offline and error states; never present an empty list as proof that no records exist until its query has completed.
- For enquiry submission, show truthful stages for secure session creation, attachment upload and Firestore save. Display upload progress only from UploadThing callbacks and submission success only after Firestore confirms the write. On timeout or failure, preserve entered details and the stable pending enquiry ID so a retry does not silently create duplicates. Do not claim offline submission or background sync unless a durable, tested queue exists.
- For messaging, show send progress and persisted success/failure, retain drafts on failure, and derive unread indicators from actual message records/last-read markers. Push is supplementary and must not change a successful Firestore result into a failure.
- For media uploads, show per-operation progress, accepted file types/size limits, completion and actionable errors. Never show a published asset until its upload and save both succeed.
- Admin actions must have independent busy states, clear confirmation for destructive changes, and success feedback only after the server/Firestore confirms persistence. Keep authorization errors distinct from network and validation errors.
- Public work feeds and service catalogues need loading, empty, recoverable error and retry states. Public analytics must be aggregated and privacy-safe; never expose customer identity, private project details or contact information.
- Maintain consistent Grandynamic branding and concise, mobile-first feedback. Avoid blocking the whole application for a local action; keep section boundaries and enough spacing to scan operational information.
- Do not add decorative progress percentages, invented ETAs, optimistic success, fake unread counts or claims of synchronization that the underlying persistence does not support.

## Offline PWA operating contract

- The installed PWA must open its cached public shell while offline and provide a clear offline fallback. Public pages/assets may be cached for read-only access; cached content can be stale and must never be represented as live.
- Never cache authenticated /account or /admin screens, private /project/{shareId} pages, or API responses in the service-worker cache. These require a live connection and fresh authorization. On service-worker cache-policy changes, increment the cache namespace so obsolete private entries are purged.
- Enquiry submission, messaging, authentication, notifications and UploadThing uploads require connectivity in the current implementation. Preserve form details on the open page when a request fails, but do not say a request is queued or synced unless a durable IndexedDB queue, retry protocol, idempotency and user-visible reconciliation have been implemented and tested.
- Do not cache private customer data to make offline screens appear functional. Do not loosen Firebase rules or authorization to support offline access.
- Preserve the native install prompt lifecycle, dismissible install card, embedded-browser handling, iOS guidance and responsive presentation. Ordinary offline improvements must not redesign installation UX.
- QA must include: install/open once online; load home, services, basket and enquiry; close/reopen in airplane mode; confirm public cached pages and offline fallback work; confirm account/admin/private project routes do not reveal cached private content; reconnect and verify normal network access. Separately test enquiry/message failure and retry without claiming a submission was saved offline.

