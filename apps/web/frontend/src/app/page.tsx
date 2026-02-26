'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Navbar, Footer } from '@/components/layout';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <Navbar />

      {/* Hero Section */}
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Reclutamiento{' '}
              <span className={styles.heroHighlight}>Inteligente</span>
            </h1>
            <p className={styles.heroDescription}>
              Optimiza tu proceso de selección con análisis de currículums
              potenciado por IA. Encuentra los mejores candidatos en menos tiempo.
            </p>
            <div className={styles.heroActions}>
              <Link href="/register">
                <Button size="lg">Comenzar gratis</Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg">
                  Ver demostración
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className={styles.features}>
            <FeatureCard
              icon={<DocumentIcon />}
              title="Análisis de CV"
              description="Extrae automáticamente la información relevante de cada currículum con precisión."
            />
            <FeatureCard
              icon={<ChartIcon />}
              title="Ranking inteligente"
              description="Compara candidatos con los requisitos del puesto y obtén puntuaciones objetivas."
            />
            <FeatureCard
              icon={<CalendarIcon />}
              title="Gestión de entrevistas"
              description="Programa y organiza las entrevistas desde un solo lugar."
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </div>
  );
}

function DocumentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
