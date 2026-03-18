import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from './useUser';

const BLOCK_DURATION_MS = 60000;
const MAX_ATTEMPTS = 5;

function validateIdentifiant(identifiant: string): string {
  if (!identifiant) return 'Identifiant requis';
  if (!/^[a-z]{5}[0-9]{3}$/.test(identifiant.toLowerCase())) return 'Format invalide (ex: ndecr001)';
  return '';
}

function validatePassword(password: string): string {
  if (!password) return 'Mot de passe requis';
  if (password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
  return '';
}

export function useLoginForm() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useUser();

  const [formData, setFormData] = useState({ identifiant: '', password: '' });
  const [formErrors, setFormErrors] = useState({ identifiant: '', password: '' });
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;

    const identifiantError = validateIdentifiant(formData.identifiant);
    const passwordError = validatePassword(formData.password);

    if (identifiantError || passwordError) {
      setFormErrors({ identifiant: identifiantError, password: passwordError });
      return;
    }

    try {
      await login({
        identifiant: formData.identifiant.toLowerCase(),
        password: formData.password,
      });
    } catch (err) {
      const newCount = attemptCount + 1;
      setAttemptCount(newCount);
      if (newCount >= MAX_ATTEMPTS) {
        setIsBlocked(true);
        setTimeout(() => {
          setIsBlocked(false);
          setAttemptCount(0);
        }, BLOCK_DURATION_MS);
      }
      console.error('Login failed:', err);
    }
  };

  return {
    formData,
    formErrors,
    attemptCount,
    isBlocked,
    isLoading,
    error,
    clearError,
    handleChange,
    handleSubmit,
    MAX_ATTEMPTS,
  };
}
