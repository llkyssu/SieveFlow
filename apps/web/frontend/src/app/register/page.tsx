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
import styles from '../login/page.module.css';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!email) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'El formato del correo es incorrecto';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 12) {
      newErrors.password = 'La contraseña debe tener al menos 12 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
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
      await authService.register({ name: name.trim(), email, password });
      router.push('/dashboard');
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.isValidationError) {
          setErrors({ general: error.message });
        } else if (error.statusCode === 409) {
          setErrors({ email: 'Este correo ya está registrado' });
        } else {
          setErrors({ general: 'Error al registrar. Intenta de nuevo.' });
        }
      } else {
        setErrors({ general: 'Error de conexión.' });
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
          <p className={styles.tagline}>Crea tu cuenta y comienza a reclutar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>
              Completa los datos para registrarte en la plataforma
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
                label="Nombre completo"
                type="text"
                name="name"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                disabled={isLoading}
                autoComplete="name"
                autoFocus
              />

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
              />

              <Input
                label="Contraseña"
                type="password"
                name="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                helperText="Mínimo 12 caracteres"
                disabled={isLoading}
                autoComplete="new-password"
              />

              <Input
                label="Confirmar contraseña"
                type="password"
                name="confirmPassword"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                disabled={isLoading}
                autoComplete="new-password"
              />

              <p className={styles.termsText}>
                Al registrarte, aceptas nuestros{' '}
                <Link href="/terms" className={styles.termsLink}>
                  Términos de servicio
                </Link>{' '}
                y{' '}
                <Link href="/privacy" className={styles.termsLink}>
                  Política de privacidad
                </Link>
                .
              </p>

              <Button type="submit" fullWidth isLoading={isLoading}>
                Crear cuenta
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <p className={styles.footerText}>
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className={styles.footerLink}>
                Inicia sesión
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
