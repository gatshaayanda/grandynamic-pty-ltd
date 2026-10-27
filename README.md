# Grandynamic Pty Ltd

Grandynamic Pty Ltd is a customer-first welding and steel-fabrication enquiry PWA for Botswana. This repository was founded from the approved Africhiko PWA baseline; its installation and chatbot behaviour must remain protected while business identity and presentation are adapted.

## Customer journey

1. Browse the service catalogue and indicative starting prices.
2. Add services to a single project request, or describe a custom project.
3. Submit contact details, project location, dimensions, materials and notes for review.
4. After submission, create a customer account to keep enquiries associated with the same Firebase identity, or continue as a guest.

An enquiry is not a confirmed quotation or job. Grandynamic Pty Ltd reviews the details before discussing a quote.

## Customer account

The account page supports email/password sign-in and account creation. When a guest creates an account during the enquiry journey, the existing anonymous Firebase user is linked to the new credential so the customer identity and associated enquiries are preserved.

## Progressive web app

- The install card is dismissible and calls the browser's native install prompt when the browser provides one.
- On iPhone and iPad, installation is handled through Safari's Share menu and **Add to Home Screen**; Chromium's `beforeinstallprompt` event is not a universal iOS installation mechanism.
- The service worker uses a Grandynamic Pty Ltd-specific cache namespace to keep this app's cached shell separate from other projects.

## Enquiry messages and push notifications

Customers and workshop staff can exchange messages inside each enquiry. Customers see live status changes and can opt in to browser push updates; the workshop can opt in to new-enquiry and customer-message alerts. Push delivery is an additional channel: saving an enquiry or message does not depend on a push provider being available.

Configure `NEXT_PUBLIC_FIREBASE_VAPID_KEY` with the **public** Web Push certificate key from Firebase Console → Project settings → Cloud Messaging → Web Push certificates. Enable the Firebase Cloud Messaging API for the same Grandynamic Pty Ltd Firebase project. Configure `FIREBASE_ADMIN_KEY` as a server-only Vercel environment variable using Grandynamic Pty Ltd’s service account JSON; never expose or commit it. The `NEXT_PUBLIC_FIREBASE_*` variables and VAPID public key are public client configuration, not secrets.

After deploying the environment values, each customer or staff device must use **Enable notifications** from its account/dashboard and grant browser permission. Test both roles on separate devices/browser profiles, including a backgrounded or closed app. Browser push requires HTTPS and browser support; on iPhone/iPad, use Safari’s Add to Home Screen web-app experience and then grant notification permission where supported.

## Operations

The `/admin` route is the staff surface for reviewing enquiries and managing fabrication services. It depends on the Grandynamic Pty Ltd Firebase project configuration and the project's configured staff authorization.

## Stack

- Next.js 15 / React 19 / TypeScript
- Firebase Authentication and Cloud Firestore
- Firebase Storage for project reference uploads and service media
- Progressive Web App support
- Vercel Analytics and Speed Insights
- Vercel deployment from GitHub `main`

## Development

Install dependencies and run the local development server:

```bash
npm install
npm run dev
```

Before QA, configure the `NEXT_PUBLIC_FIREBASE_*` environment variables for the Grandynamic Pty Ltd Firebase project and verify the relevant Firestore and Storage rules. Run lint, type checks and a production build before considering the branch release-ready.

Never commit `.env.local`, service-account credentials or other private secrets.


## Grandynamic setup checkpoint

- Set `NEXT_PUBLIC_BASE_URL` to the actual production URL before release.
- Configure a dedicated Grandynamic Firebase project and review Authentication, Firestore rules, Storage, server credentials, notification settings and admin allowlist before production use. Do not reuse Africhiko production credentials or data.
- Confirm the business's approved admin Google account(s), phone/email, workshop address and final brand assets before publishing those details.
- UploadThing is included in the codebase, but verify its route and environment configuration before claiming uploads are production-ready.
