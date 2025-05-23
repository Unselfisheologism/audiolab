
import Link from 'next/link';

const legalLinks = [
  { href: '/faq', label: 'FAQ' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/licenses', label: 'Third-Party Licenses' },
];

export function LegalLinks() {
  return (
    <div className="py-4">
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {legalLinks.map((link) => (
          <Link key={link.href} href={link.href} passHref>
            <span className="text-sm text-gray-900 hover:text-primary hover:underline cursor-pointer">
              {link.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
