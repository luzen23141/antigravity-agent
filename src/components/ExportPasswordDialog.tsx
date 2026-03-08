import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Modal } from "antd";
import { useTranslation } from 'react-i18next';
import { BasePasswordInput } from '@/components/base-ui/BaseInput.tsx';

interface ExportPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

const ExportPasswordDialog: React.FC<ExportPasswordDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  onCancel
}) => {
  const { t } = useTranslation('importExport');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string>('');

  const validatePassword = (value: string) => {
    if (value.length < 4) return { isValid: false, message: t('validation.passwordTooShort') };
    if (value.length > 50) return { isValid: false, message: t('validation.passwordTooLong') };
    return { isValid: true };
  };

  const resetState = () => {
    setPassword('');
    setConfirmPassword('');
    setValidationError('');
  };

  const handleSubmit = () => {
    setValidationError('');

    if (!password.trim()) {
      setValidationError(t('validation.passwordRequired'));
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setValidationError(validation.message || t('validation.passwordInvalid'));
      return;
    }

    if (password !== confirmPassword) {
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

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (validationError) {
      setValidationError('');
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (validationError) {
      setValidationError('');
    }
  };

  const isValid = password.trim() !== '' && validatePassword(password).isValid && password === confirmPassword;

  return (
    <Modal
      open={isOpen}
      footer={null}
      onCancel={handleClose}
      className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[24px] [&_.ant-modal-content]:border [&_.ant-modal-content]:border-border [&_.ant-modal-content]:bg-card/95 [&_.ant-modal-content]:shadow-[0_32px_80px_-40px_rgba(15,23,42,0.55)] [&_.ant-modal-content]:backdrop-blur-xl"
      width={560}
      style={{ top: 72 }}
      styles={{
        header: {
          marginBottom: 0,
          padding: '20px 20px 0',
          background: 'transparent',
        },
        body: {
          padding: 0,
        },
      }}
      title={
        <div className="flex items-center gap-2 text-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-base font-semibold leading-none">{t('export.title')}</div>
            <div className="mt-1 text-xs font-normal text-muted-foreground">{t('export.description')}</div>
          </div>
        </div>
      }
    >
      <div className="space-y-5 p-6">
        <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/35 p-4">
          <BasePasswordInput
            autoFocus
            label={t('export.password')}
            value={password}
            onChange={e => handlePasswordChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && isValid) {
                handleSubmit();
              }
            }}
            placeholder={t('export.passwordPlaceholder')}
            error={validationError || undefined}
          />

          <BasePasswordInput
            label={t('export.confirmPassword')}
            value={confirmPassword}
            onChange={e => handleConfirmPasswordChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && isValid) {
                handleSubmit();
              }
            }}
            placeholder={t('export.confirmPasswordPlaceholder')}
            error={validationError || undefined}
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/70 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background/80 px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-accent"
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-primary/90 bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/15 transition-[background-color,border-color,box-shadow,transform] duration-200 hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('export.title')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportPasswordDialog;
