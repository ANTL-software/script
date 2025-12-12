import './loginPage.scss';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../hooks/useUser';
import Input from '../../components/input/Input';
import Button from '../../components/button/Button';
import ErrorMessage from '../../components/errorMessage/ErrorMessage';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useUser();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState({
    email: '',
    password: '',
  });

  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (attemptCount >= 5) {
      setIsBlocked(true);
      const timer = setTimeout(() => {
        setIsBlocked(false);
        setAttemptCount(0);
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [attemptCount]);

  const validateEmail = (email: string): string => {
    if (!email) {
      return 'Email requis';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Email invalide';
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Mot de passe requis';
    }
    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }

    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      return;
    }

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setFormErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
    } catch (err) {
      setAttemptCount((prev) => prev + 1);
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <figure className="login-logo">
            <img src="/logo-antl.png" alt="ANTL" />
          </figure>
          <h1 className="login-title">Connexion</h1>
          <p className="login-subtitle">
            Connectez-vous pour accéder au script de vente
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <ErrorMessage
              message={error}
              onClose={clearError}
            />
          )}

          {isBlocked && (
            <ErrorMessage
              message="Trop de tentatives de connexion. Veuillez réessayer dans 1 minute."
            />
          )}

          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="votre.email@antl.com"
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            required
            disabled={isLoading || isBlocked}
            autoComplete="email"
            autoFocus
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Mot de passe"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            required
            disabled={isLoading || isBlocked}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            isLoading={isLoading}
            disabled={isBlocked}
          >
            Se connecter
          </Button>

          {attemptCount > 0 && attemptCount < 5 && (
            <p className="login-attempt-warning">
              Tentative {attemptCount}/5
            </p>
          )}
        </form>

        <div className="login-footer">
          <p className="login-footer-text">
            © {new Date().getFullYear()} ANTL - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
