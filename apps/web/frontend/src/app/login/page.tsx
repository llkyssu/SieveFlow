'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Button,
  ThemeToggle,
} from '@/components/ui';
import { authService, ApiRequestError } from '@/services';
import styles from './page.module.css';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'El formato del correo es incorrecto';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await authService.login({ email, password });
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.isUnauthorized) {
          setErrors({ general: 'Credenciales incorrectas' });
        } else if (error.isValidationError) {
          setErrors({ general: error.message });
        } else {
          setErrors({ general: 'Error al iniciar sesión. Intenta de nuevo.' });
        }
      } else {
        setErrors({ general: 'Error de conexión. Verifica tu internet.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.themeToggle}>
        <ThemeToggle />
      </div>

      <div className={styles.container}>
        <div className={styles.branding}>
          <h1 className={styles.logo}>SieveFlow</h1>
          <p className={styles.tagline}>Reclutamiento inteligente</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className={styles.form}>
              {errors.general && (
                <div className={styles.alert} role="alert">
                  {errors.general}
                </div>
              )}

              <Input
                label="Correo electrónico"
                type="email"
                name="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />

              <Input
                label="Contraseña"
                type="password"
                name="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                disabled={isLoading}
                autoComplete="current-password"
              />

              <div className={styles.rememberRow}>
                <label className={styles.rememberLabel}>
                  <input type="checkbox" className={styles.checkbox} />
                  Recordarme
                </label>
                <Link href="/forgot-password" className={styles.forgotLink}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button type="submit" fullWidth isLoading={isLoading}>
                Iniciar sesión
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <p className={styles.footerText}>
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className={styles.footerLink}>
                Regístrate
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className={styles.copyright}>
          © 2026 SieveFlow. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
