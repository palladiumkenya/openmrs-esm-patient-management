import React, { type Dispatch } from 'react';
import styles from './hie-client-registry.scss';
import { type FormikProps } from 'formik';
import { type FormValues } from '../../patient-registration/patient-registration.types';
import { useTranslation } from 'react-i18next';
import { Tile, ComboBox, Button, TextInput, InlineLoading } from '@carbon/react';
import { Search } from '@carbon/react/icons';
import { showModal, showSnackbar, useConfig } from '@openmrs/esm-framework';
import { z } from 'zod';
import { type RegistrationConfig } from '../../config-schema';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fetchPatientFromHIE, mapHIEPatientToFormValues } from './hie-resource';
import { type HIEPatientResponse, type HIEPatient, type ErrorResponse } from './hie-types';

type HIEClientRegistryProps = {
  props: FormikProps<FormValues>;
  setInitialFormValues: Dispatch<FormValues>;
};

type HIEFormValues = {
  identifierType: string;
  identifierValue: string;
};

const HIEFormSchema = z.object({
  identifierType: z.string().min(1, { message: 'Identifier type is required' }),
  identifierValue: z.string().min(1, { message: 'Identifier value is required' }),
});

const HIEClientRegistry: React.FC<HIEClientRegistryProps> = ({ setInitialFormValues, props }) => {
  const { t } = useTranslation();
  const { control, handleSubmit, watch, formState } = useForm<HIEFormValues>({
    mode: 'all',
    defaultValues: { identifierType: '', identifierValue: '' },
    resolver: zodResolver(HIEFormSchema),
  });
  const {
    hieClientRegistry: { identifierTypes },
  } = useConfig<RegistrationConfig>();

  const isHIEPatientResponse = (
    response: HIEPatientResponse | ErrorResponse | undefined,
  ): response is HIEPatientResponse => {
    return response?.resourceType === 'Bundle' && 'total' in response;
  };

  const isOperationOutcome = (response: HIEPatientResponse | ErrorResponse | undefined): response is ErrorResponse => {
    return response?.resourceType === 'OperationOutcome' && 'issue' in response;
  };

  const onSubmit: SubmitHandler<HIEFormValues> = async (data: HIEFormValues, event: React.BaseSyntheticEvent) => {
    try {
      const hieClientRegistry = await fetchPatientFromHIE(data.identifierType, data.identifierValue);

      if (isHIEPatientResponse(hieClientRegistry)) {
        if (hieClientRegistry.total === 0) {
          const dispose = showModal('empty-client-registry-modal', {
            onConfirm: () => dispose(),
            close: () => dispose(),
            title: t('clientRegistryEmptys', 'Create Patient'),
            message: t(
              'patientNotFounds',
              `The patient records could not be found in the client registry, proceed to create patient or try again.`,
            ),
          });
          return;
        }

        const dispose = showModal('hie-confirmation-modal', {
          patient: hieClientRegistry,
          closeModal: () => dispose(),
          onUseValues: () =>
            setInitialFormValues(
              mapHIEPatientToFormValues(hieClientRegistry as unknown as HIEPatientResponse, props.values),
            ),
        });
      } else if (isOperationOutcome(hieClientRegistry)) {
        const issueMessage = hieClientRegistry?.issue?.map((issue) => issue.diagnostics).join(', ');
        const dispose = showModal('empty-client-registry-modal', {
          onConfirm: () => dispose(),
          close: () => dispose(),
          title: t('clientRegistryEmpty', 'Create & Post Patient'),
          message: issueMessage || t('errorOccurred', ' There was an error processing the request. Try again later'),
        });
      } else {
        showSnackbar({
          title: t('unexpectedResponse', 'Unexpected Response'),
          subtitle: t('contactAdmin', 'Please contact the administrator.'),
          kind: 'error',
          isLowContrast: true,
        });
      }
    } catch (error) {
      showSnackbar({
        title: t('errorFetchingPatient', 'Error fetching patient'),
        subtitle: error.message,
        kind: 'error',
        isLowContrast: true,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.hieContainer}>
      <h3 className={styles.productiveHeading02} style={{ color: '#161616' }}>
        {t('patientVerificationFromHIE', 'Patient verification from HIE')}
      </h3>
      <span className={styles.label01}>
        {t('allFieldsRequiredText', 'All fields are required unless marked optional')}
      </span>
      <Tile className={styles.grid}>
        <Controller
          control={control}
          name="identifierType"
          render={({ field: { onChange, value, onBlur, ref }, fieldState }) => (
            <ComboBox
              light
              style={{ borderBottom: 'none' }}
              onChange={({ selectedItem }) => onChange(selectedItem?.identifierValue)}
              id="identifier-combobox"
              items={identifierTypes}
              placeholder={t('selectIdentifierType', 'Select identifier type')}
              itemToString={(item) => (item ? item.identifierType : '')}
              titleText={t('identifierType', 'Identifier type')}
              invalid={!!fieldState?.error?.message}
              invalidText={fieldState?.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="identifierValue"
          render={({ field, fieldState }) => (
            <TextInput
              disabled={watch('identifierType') === ''}
              light
              id="identifier-search"
              placeholder={t('enterIdentifierSearchValue', 'Enter identifier search value')}
              type="text"
              labelText={t('identifierSearch', 'Identifier search')}
              invalid={!!fieldState?.error?.message}
              invalidText={fieldState?.error?.message}
              {...field}
            />
          )}
        />
        <Button
          onClick={handleSubmit(onSubmit)}
          renderIcon={(props) => <Search size={24} {...props} />}
          iconDescription={t('searchRegistry', 'Search registry')}
          size="md"
          disabled={!watch('identifierType') || !watch('identifierValue') || formState.isSubmitting}
          kind="tertiary">
          {formState.isSubmitting
            ? t('searchingRegistry', 'Searching registry...')
            : t('searchRegistry', 'Search registry')}
        </Button>
      </Tile>
    </form>
  );
};

export default HIEClientRegistry;
