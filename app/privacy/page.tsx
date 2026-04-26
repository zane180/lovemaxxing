import Link from 'next/link'
import { Heart } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — Lovemaxxing',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-cream-300 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-burgundy-900 fill-burgundy-900" />
            <span className="font-serif text-xl font-bold text-burgundy-950">Lovemaxxing</span>
          </Link>
          <Link href="/" className="text-sm text-burgundy-900 hover:underline">Back to App</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl font-bold text-burgundy-950 mb-2">Privacy Policy</h1>
        <p className="text-burgundy-800/60 mb-12">Last updated: April 2026</p>

        {[
          {
            title: '1. Information We Collect',
            body: `When you create a Lovemaxxing account, we collect information you provide directly: your name, email address, date of birth, gender, and sexual orientation preference. During onboarding, you optionally provide a bio, interests, personality vibes, photos, and face feature preferences.

We automatically collect limited usage data (pages visited, swipe actions, message timestamps) to improve match quality and app performance. We do not collect precise geolocation unless you explicitly provide a city.`,
          },
          {
            title: '2. How We Use Your Information',
            body: `We use your information to: operate the matching algorithm and surface compatible profiles; deliver real-time chat between matched users; send transactional emails (match notifications, verification, password resets); improve and personalize the Lovemaxxing experience.

We do not sell your personal data to third parties. We do not use your data for advertising.`,
          },
          {
            title: '3. Face Analysis & Biometric Data',
            body: `Lovemaxxing uses DeepFace technology to analyze your uploaded photos and detect general facial attributes (approximate age range, face shape, skin tone, expression). This analysis produces descriptive text labels — not biometric templates or facial recognition fingerprints.

We do not perform facial recognition or identify individuals across photos. Detected feature labels are stored as plain text strings and used solely to compute match compatibility scores. You can delete your analyzed features at any time from your profile settings.`,
          },
          {
            title: '4. Photo Storage',
            body: `Your photos are stored securely via Cloudinary (our cloud storage provider) or on our own servers depending on your region. Photos are not shared with third parties. We apply automatic transformations (resize, quality optimization) for faster delivery.

You can delete your photos at any time from your profile page. Deleted photos are permanently removed within 30 days.`,
          },
          {
            title: '5. Data Sharing',
            body: `We share data with the following categories of service providers only to the extent necessary to operate Lovemaxxing:

• Cloud infrastructure (hosting, database)
• Image storage (Cloudinary)
• Email delivery (SMTP provider)

All providers are contractually bound to protect your data and may not use it for their own purposes.`,
          },
          {
            title: '6. Data Retention',
            body: `We retain your account data for as long as your account is active. If you delete your account, we permanently delete your profile, photos, messages, and match history within 30 days, except where retention is required by law.

Aggregated, anonymized analytics data (no personal identifiers) may be retained indefinitely.`,
          },
          {
            title: '7. Your Rights',
            body: `Depending on your location, you may have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your data; export your data in a machine-readable format; object to certain processing.

To exercise these rights, contact us at privacy@lovemaxxing.com. We will respond within 30 days.`,
          },
          {
            title: '8. Security',
            body: `We protect your data using industry-standard measures including: bcrypt password hashing; JWT authentication with short-lived tokens; HTTPS encryption in transit; access controls limiting who can access production data.

No system is 100% secure. If you believe your account has been compromised, contact us immediately.`,
          },
          {
            title: '9. Children\'s Privacy',
            body: `Lovemaxxing is strictly for users 18 years of age and older. We verify minimum age during registration and take reasonable steps to prevent underage access. If we discover a user is under 18, we will immediately delete their account and data.

If you believe a minor has created an account, please report it to safety@lovemaxxing.com.`,
          },
          {
            title: '10. Contact Us',
            body: `For privacy questions, data requests, or concerns:\n\nEmail: privacy@lovemaxxing.com\n\nWe aim to respond to all inquiries within 5 business days.`,
          },
        ].map((section) => (
          <section key={section.title} className="mb-10">
            <h2 className="font-serif text-xl font-bold text-burgundy-950 mb-3">{section.title}</h2>
            <p className="text-burgundy-800/70 leading-relaxed whitespace-pre-line">{section.body}</p>
          </section>
        ))}
      </div>

      <footer className="border-t border-cream-300 py-8 px-6 text-center">
        <p className="text-sm text-burgundy-800/50">
          © 2026 Lovemaxxing ·{' '}
          <Link href="/terms" className="hover:text-burgundy-900">Terms</Link> ·{' '}
          <Link href="/privacy" className="hover:text-burgundy-900">Privacy</Link>
        </p>
      </footer>
    </div>
  )
}
