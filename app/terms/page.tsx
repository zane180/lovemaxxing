import Link from 'next/link'
import { Heart } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service — Lovemaxxing',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-cream-300 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-burgundy-900 fill-burgundy-900" />
            <span className="font-serif text-xl font-bold text-burgundy-950">Lovemaxxing</span>
          </Link>
          <Link href="/discover" className="text-sm text-burgundy-900 hover:underline">Back to App</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl font-bold text-burgundy-950 mb-2">Terms of Service</h1>
        <p className="text-burgundy-800/60 mb-12">Last updated: April 2025</p>

        {[
          {
            title: '1. Acceptance of Terms',
            body: `By creating a Lovemaxxing account, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the service.

We may update these terms at any time. We'll notify you of material changes by email or in-app notification. Continued use after changes constitutes acceptance.`,
          },
          {
            title: '2. Eligibility',
            body: `You must be at least 18 years old to use Lovemaxxing. By registering, you confirm that you meet this requirement. We reserve the right to terminate accounts we determine belong to users under 18.`,
          },
          {
            title: '3. Your Account',
            body: `You are responsible for maintaining the security of your account and password. You must provide accurate information when creating your profile. You may not create multiple accounts, impersonate others, or transfer your account.

You are responsible for all activity that occurs under your account.`,
          },
          {
            title: '4. Acceptable Use',
            body: `You agree not to:

• Post false, misleading, or fraudulent content
• Upload photos of other people without their consent
• Harass, threaten, or intimidate other users
• Send unsolicited messages or spam
• Use the service for commercial solicitation
• Attempt to access other users' accounts
• Scrape or harvest data from the platform
• Use the service for any illegal purpose

Violations may result in immediate account suspension or termination.`,
          },
          {
            title: '5. Content & Photos',
            body: `You retain ownership of content you post. By posting content, you grant Lovemaxxing a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the app.

You must not post content that is: sexually explicit or pornographic; violent or threatening; hateful or discriminatory; infringing on third-party intellectual property rights.

We reserve the right to remove any content that violates these terms without notice.`,
          },
          {
            title: '6. Safety',
            body: `Lovemaxxing provides tools to block and report users. We investigate all reports and take appropriate action, which may include warnings, temporary suspension, or permanent bans.

We strongly encourage you to: meet new matches in public places; tell a friend where you're going; trust your instincts.

Lovemaxxing is not responsible for the conduct of users on or off the platform. Use the service at your own risk.`,
          },
          {
            title: '7. AI Features',
            body: `Lovemaxxing uses AI to analyze facial features and compute compatibility scores. These features are provided "as is" and for entertainment and matching purposes only. Match scores are not guarantees of compatibility.

Face analysis produces general descriptors only and does not constitute biometric identification.`,
          },
          {
            title: '8. Disclaimer of Warranties',
            body: `The service is provided "as is" without warranties of any kind, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or that matches will result in romantic connections.`,
          },
          {
            title: '9. Limitation of Liability',
            body: `To the maximum extent permitted by law, Lovemaxxing shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.`,
          },
          {
            title: '10. Termination',
            body: `You may delete your account at any time from the Settings page. We may suspend or terminate your account at our discretion if you violate these terms.

Upon termination, your right to use the service ceases immediately. Data deletion occurs as described in our Privacy Policy.`,
          },
          {
            title: '11. Contact',
            body: `For terms-related questions:\n\nEmail: legal@lovemaxxing.com`,
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
          © 2025 Lovemaxxing ·{' '}
          <Link href="/terms" className="hover:text-burgundy-900">Terms</Link> ·{' '}
          <Link href="/privacy" className="hover:text-burgundy-900">Privacy</Link>
        </p>
      </footer>
    </div>
  )
}
