import './loginPage.scss';
import antlLogo from '../../../assets/antlLogo.png';
import { useLoginForm } from '../../../hooks/useLoginForm';
import Input from '../../components/input/Input';
import Button from '../../components/button/Button';
import ErrorMessage from '../../components/errorMessage/ErrorMessage';

export default function LoginPage() {
  const {
    formData, formErrors, attemptCount, isBlocked,
    isLoading, error, clearError,
    handleChange, handleSubmit, MAX_ATTEMPTS,
  } = useLoginForm();

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <figure className="login-logo">
            <img src={antlLogo} alt="ANTL" />
          </figure>
          <h1 className="login-title">Connexion</h1>
          <p className="login-subtitle">
            Connectez-vous pour accéder au script de vente
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <ErrorMessage message={error} onClose={clearError} />}

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

          {attemptCount > 0 && attemptCount < MAX_ATTEMPTS && (
            <p className="login-attempt-warning">
              Tentative {attemptCount}/{MAX_ATTEMPTS}
            </p>
          )}
        </form>

        <div className="login-footer">
          <p className="login-footer-text">
            © {new Date().getFullYear()} antl - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
