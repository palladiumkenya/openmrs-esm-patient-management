import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@carbon/react';

interface EmptyPromptProps {
  onConfirm: void;
  close: void;
  title?: string;
  message?: string;
}

const EmptyPrompt: React.FC<EmptyPromptProps> = ({ close, onConfirm, title, message }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="cds--modal-header">
        <h3 className="cds--modal-header__heading">{title ?? t('clientRegistryEmpty', 'Create & Post Patient')}</h3>
      </div>
      <div className="cds--modal-content">
        <p>
          {message ??
            t(
              'patientNotFound',
              'The patient records could not be found in Client registry, do you want to continue to create and post patient to registry',
            )}
        </p>
      </div>
      <div className="cds--modal-footer">
        <Button kind="secondary" onClick={close}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button onClick={onConfirm}>{t('continue', 'Continue to registration')}</Button>
      </div>
    </>
  );
};

export default EmptyPrompt;
