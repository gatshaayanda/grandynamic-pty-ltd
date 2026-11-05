# Visible Work, Loading & Operational Transparency

Grandynamic should make real work visible without inventing progress or overstating what has completed. This standard applies from the public landing page through enquiry submission, customer accounts, workshop sharing and admin operations.

## Interaction states

Every asynchronous operation must communicate its actual state:

- **Loading:** use compact skeletons or stable placeholders. Do not flash a false empty state while data is still loading.
- **Working:** show action-specific progress and disable only controls that would duplicate or conflict with that operation.
- **Success:** show only after the underlying write or server action confirms persistence.
- **Failure:** explain what failed, preserve recoverable user input and give a practical retry path.
- **Empty:** distinguish a genuinely empty result from loading, offline and failed retrieval.

Avoid decorative percentages, invented ETAs, optimistic success and global blocking spinners for local actions.

## Enquiries and uploads

The enquiry journey should show secure session creation, attachment upload and Firestore persistence as separate stages. Upload progress must come from UploadThing's actual callbacks. A successful enquiry confirmation must follow a confirmed Firestore write. Keep the pending enquiry ID stable across retries to reduce accidental duplicates. If the connection fails, retain entered details and explain that receipt has not been confirmed.

Media workflows must communicate file type/size limits, real upload progress, save/publish completion and actionable errors. An asset is not published merely because its upload completed.

## Messaging and notifications

Show message sending and persisted success/failure. Preserve drafts after failure. Unread indicators must be derived from real message/last-read data. Push notifications are a secondary delivery channel: a push failure must not invalidate a message or enquiry already saved to Firestore. Do not claim a notification was displayed merely because FCM accepted a send request.

## Admin operations

Give each independent admin action its own working state. Confirm destructive actions. Separate validation, authorization, connectivity and persistence errors. Show success only after the server or Firestore confirms the change. Operational lists need explicit loading, empty, retry and error states.

## Public feeds and privacy

Service and published-work feeds need loading, empty and recoverable error states. Public analytics must be aggregated and privacy-safe. Never expose customer identity, phone numbers, private enquiry data, internal notes or private project details in public feeds or metrics.

## Offline PWA behaviour

The installed PWA must open its cached **public** shell offline and provide a clear offline fallback. Public cached pages are read-only and may be stale; they must not be presented as live.

Authenticated `/account` and `/admin` screens, private `/project/{shareId}` pages and API responses must not be persisted in the service-worker cache. They require connectivity and fresh authorization. Increment the cache namespace when changing cache policy so obsolete cached private pages are removed.

In the current implementation, enquiry submission, messaging, sign-in, notifications and UploadThing uploads require an internet connection. The interface must say so. Preserving a form in the currently open page is not the same as a durable offline queue. Do not claim queued submission or background synchronization unless a durable IndexedDB queue, retry protocol, idempotency and user-visible reconciliation are implemented and tested.

Do not cache private customer data or weaken Firebase rules to simulate offline access. Preserve the approved native installation prompt, branded dismissible card, embedded-browser handling and iOS guidance.

## Release QA

1. Install/open Grandynamic while online and visit home, services, basket and enquiry.
2. Close and reopen the installed app in airplane mode; verify cached public pages and the offline fallback.
3. Attempt account, admin and private project routes offline; confirm no previously cached private content is displayed.
4. Reconnect; confirm public routes recover and account/admin routes require fresh authorization.
5. Submit an enquiry and send a message online; verify progress, persistence and truthful confirmation.
6. Repeat with the connection disabled; verify no false success, retained input where the page remains open, and a clear retry path after reconnecting.
7. Test UploadThing separately; offline upload must fail clearly and must not be reported as complete.

A GitHub push or successful build does not replace installed-device QA. Report production deployment and real-device verification separately.
