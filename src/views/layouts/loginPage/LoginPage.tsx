import './loginPage.scss';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../hooks/useUser';
import Input from '../../components/input/Input';
import Button from '../../components/button/Button';
import ErrorMessage from '../../components/errorMessage/ErrorMessage';

const BLOCK_DURATION_MS = 60000;
const MAX_ATTEMPTS = 5;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useUser();

  const [formData, setFormData] = useState({
    identifiant: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState({
    identifiant: '',
    password: '',
  });

  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateIdentifiant = (identifiant: string): string => {
    if (!identifiant) {
      return 'Identifiant requis';
    }
    // Format: 5 lettres + 3 chiffres (ex: ndecr001)
    const identifiantRegex = /^[a-z]{5}[0-9]{3}$/;
    if (!identifiantRegex.test(identifiant.toLowerCase())) {
      return 'Format invalide (ex: ndecr001)';
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

    const identifiantError = validateIdentifiant(formData.identifiant);
    const passwordError = validatePassword(formData.password);

    if (identifiantError || passwordError) {
      setFormErrors({
        identifiant: identifiantError,
        password: passwordError,
      });
      return;
    }

    try {
      await login({
        identifiant: formData.identifiant.toLowerCase(),
        password: formData.password,
      });
    } catch (err) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      if (newAttemptCount >= MAX_ATTEMPTS) {
        setIsBlocked(true);
        setTimeout(() => {
          setIsBlocked(false);
          setAttemptCount(0);
        }, BLOCK_DURATION_MS);
      }
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
            id="identifiant"
            name="identifiant"
            type="text"
            label="Identifiant"
            placeholder="ndecr001"
            value={formData.identifiant}
            onChange={handleChange}
            error={formErrors.identifiant}
            required
            disabled={isLoading || isBlocked}
            autoComplete="username"
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
