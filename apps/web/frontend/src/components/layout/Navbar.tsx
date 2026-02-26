'use client';

import Link from 'next/link';
import { Button, ThemeToggle } from '@/components/ui';
import styles from './Navbar.module.css';

interface NavbarProps {
  showAuth?: boolean;
}

export function Navbar({ showAuth = true }: NavbarProps) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand}>
          <span className={styles.logo}>SieveFlow</span>
        </Link>

        <div className={styles.actions}>
          <ThemeToggle />
          {showAuth && (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Registrarse</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
