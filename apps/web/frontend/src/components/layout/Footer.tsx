import Link from 'next/link';
import styles from './Footer.module.css';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  links?: FooterLink[];
  companyName?: string;
}

const defaultLinks: FooterLink[] = [
  { label: 'Privacidad', href: '/privacy' },
  { label: 'Términos', href: '/terms' },
  { label: 'Contacto', href: '/contact' },
];

export function Footer({ 
  links = defaultLinks, 
  companyName = 'SieveFlow' 
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.copyright}>
          © {currentYear} {companyName}. Todos los derechos reservados.
        </div>
        
        <nav className={styles.nav}>
          {links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={styles.link}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
