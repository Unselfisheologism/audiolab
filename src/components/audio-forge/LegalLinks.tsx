
import Link from 'next/link';

const legalLinks = [
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About Us' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/zamzar-vs-audiolab', label: 'Zamzar VS Audio Lab' },
  { href: '/podcastle-vs-audiolab', label: 'Podcastle VS Audio Lab' },
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
