import { useState } from 'react';
import type { TFunction } from 'i18next';

interface UsePasswordDialogStateOptions {
  t: TFunction;
  requireConfirmation?: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  onOpenChange: (open: boolean) => void;
}

interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

function validatePassword(value: string, t: TFunction): PasswordValidationResult {
  if (value.length < 4) return { isValid: false, message: t('validation.passwordTooShort') };
  if (value.length > 50) return { isValid: false, message: t('validation.passwordTooLong') };
  return { isValid: true };
}

export function usePasswordDialogState({
  t,
  requireConfirmation = false,
  onSubmit,
  onCancel,
  onOpenChange,
}: UsePasswordDialogStateOptions) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const resetState = () => {
    setPassword('');
    setConfirmPassword('');
    setValidationError('');
  };

  const clearValidationError = () => {
    if (validationError) {
      setValidationError('');
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    clearValidationError();
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    clearValidationError();
  };

  const handleSubmit = () => {
    setValidationError('');

    if (!password.trim()) {
      setValidationError(t('validation.passwordRequired'));
      return;
    }

    const validation = validatePassword(password, t);
    if (!validation.isValid) {
      setValidationError(validation.message || t('validation.passwordInvalid'));
      return;
    }

    if (requireConfirmation && password !== confirmPassword) {
      setValidationError(t('validation.passwordMismatch'));
      return;
    }

    onSubmit(password);
    resetState();
  };

  const handleClose = () => {
    resetState();
    onCancel();
    onOpenChange(false);
  };

  const isValid = requireConfirmation
    ? password.trim() !== '' && validatePassword(password, t).isValid && password === confirmPassword
    : password.trim() !== '' && validatePassword(password, t).isValid;

  return {
    password,
    confirmPassword,
    validationError,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleSubmit,
    handleClose,
    isValid,
  };
}
