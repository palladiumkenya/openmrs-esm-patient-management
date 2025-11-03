import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { Button, Link, InlineLoading } from '@carbon/react';
import { XAxis, ShareKnowledge } from '@carbon/react/icons';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Form, Formik, type FormikHelpers } from 'formik';
import {
  createErrorHandler,
  interpolateUrl,
  showSnackbar,
  useConfig,
  usePatient,
  usePatientPhoto,
  useFeatureFlag,
  launchWorkspace,
  closeWorkspace,
  navigate,
} from '@openmrs/esm-framework';
import { getValidationSchema } from './validation/patient-registration-validation';
import { type CapturePhotoProps, type FormValues } from './patient-registration.types';
import { PatientRegistrationContext } from './patient-registration-context';
import { type SavePatientForm, SavePatientTransactionManager } from './form-manager';
import { DummyDataInput } from './input/dummy-data/dummy-data-input.component';
import { cancelRegistration, filterOutUndefinedPatientIdentifiers, scrollIntoView } from './patient-registration-utils';
import {
  useInitialAddressFieldValues,
  useMpiInitialFormValues,
  useInitialFormValuesLocal,
  usePatientUuidMap,
} from './patient-registration-hooks';
import { ResourcesContext } from '../offline.resources';
import { builtInSections, type RegistrationConfig, type SectionDefinition } from '../config-schema';
import { SectionWrapper } from './section/section-wrapper.component';
import BeforeSavePrompt from './before-save-prompt';
import styles from './patient-registration.scss';
import { handleSavePatientToClientRegistry } from '../client-registry/patient-verification/patient-verification-hook';

let exportedInitialFormValuesForTesting = {} as FormValues;

export interface PatientRegistrationProps {
  savePatientForm: SavePatientForm;
  isOffline: boolean;
}

export const PatientRegistration: React.FC<PatientRegistrationProps> = ({ savePatientForm, isOffline }) => {
  const healthInformationExchangeFlag = useFeatureFlag('healthInformationExchange');
  const { currentSession, identifierTypes } = useContext(ResourcesContext);
  const { search } = useLocation();
  const config = useConfig() as RegistrationConfig;
  const [target, setTarget] = useState<undefined | string>();
  const { patientUuid: uuidOfPatientToEdit } = useParams();
  const sourcePatientId = new URLSearchParams(search).get('sourceRecord');
  const { isLoading: isLoadingPatientToEdit, patient: patientToEdit } = usePatient(uuidOfPatientToEdit);
  const { t } = useTranslation();
  const [capturePhotoProps, setCapturePhotoProps] = useState<CapturePhotoProps | null>(null);
  const [initialFormValues, setInitialFormValues] = useInitialFormValuesLocal(uuidOfPatientToEdit);
  const [initialMPIFormValues, setInitialMPIFormValues] = useMpiInitialFormValues(sourcePatientId);
  const [initialAddressFieldValues] = useInitialAddressFieldValues(uuidOfPatientToEdit);
  const [patientUuidMap] = usePatientUuidMap(uuidOfPatientToEdit);
  const location = currentSession?.sessionLocation?.uuid;
  const inEditMode = isLoadingPatientToEdit ? undefined : !!(uuidOfPatientToEdit && patientToEdit);
  const showDummyData = useMemo(() => localStorage.getItem('openmrs:devtools') === 'true' && !inEditMode, [inEditMode]);
  const { data: photo } = usePatientPhoto(patientToEdit?.id);
  const savePatientTransactionManager = useRef(new SavePatientTransactionManager());
  const fieldDefinition = config?.fieldDefinitions?.filter((def) => def.type === 'address');
  const validationSchema = getValidationSchema(config);
  const [enableClientRegistry, setEnableClientRegistry] = useState(
    inEditMode ? initialFormValues.identifiers['nationalUniquePatientIdentifier']?.identifierValue : false,
  );
  const [formSavedSuccessfully, setFormSavedSuccessfully] = useState(false);

  useEffect(() => {
    if (initialMPIFormValues) {
      setInitialFormValues(initialMPIFormValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMPIFormValues, setInitialMPIFormValues]);

  useEffect(() => {
    exportedInitialFormValuesForTesting = initialFormValues;
  }, [initialFormValues]);

  const sections: Array<SectionDefinition> = useMemo(() => {
    return config.sections
      .map(
        (sectionName) =>
          config.sectionDefinitions.filter((s) => s.id == sectionName)[0] ??
          builtInSections.filter((s) => s.id == sectionName)[0],
      )
      .filter((s) => s);
  }, [config.sections, config.sectionDefinitions]);

  const onFormSubmit = async (values: FormValues, helpers: FormikHelpers<FormValues>) => {
    const abortController = new AbortController();
    helpers.setSubmitting(true);

    const updatedFormValues = { ...values, identifiers: filterOutUndefinedPatientIdentifiers(values.identifiers) };
    try {
      await savePatientForm(
        !inEditMode,
        updatedFormValues,
        patientUuidMap,
        initialAddressFieldValues,
        capturePhotoProps,
        location,
        initialFormValues['identifiers'],
        currentSession,
        config,
        savePatientTransactionManager.current,
        abortController,
      );

      helpers.resetForm({ values });

      setFormSavedSuccessfully((prev) => {
        setTimeout(() => {
          const patientUuid = values.patientUuid;
          const patientChartUrl = config.links?.submitButton
            ? interpolateUrl(config.links.submitButton, { patientUuid })
            : `\${openmrsSpaBase}/patient/${patientUuid}/chart`;

          if (inEditMode) {
            navigate({ to: patientChartUrl });
          } else {
            launchWorkspace('start-visit-workspace-form', {
              patientUuid: patientUuid,
              workspaceTitle: t('checkInPatientWorkspaceTitle', 'Check in patient'),
              closeWorkspace: () => {
                closeWorkspace('start-visit-workspace-form', {
                  onWorkspaceClose: () => {
                    navigate({ to: patientChartUrl });
                  },
                  ignoreChanges: true,
                });
              },
              closeWorkspaceWithSavedChanges: () => {
                closeWorkspace('start-visit-workspace-form', {
                  onWorkspaceClose: () => {
                    navigate({ to: patientChartUrl });
                  },
                  ignoreChanges: true,
                });
              },
            });
          }
        }, 100);
        return true;
      });

      showSnackbar({
        subtitle: inEditMode
          ? t('updatePatientSuccessSnackbarSubtitle', "The patient's information has been successfully updated")
          : t(
              'registerPatientSuccessSnackbarSubtitle',
              'The patient can now be found by searching for them using their name or ID number',
            ),
        title: inEditMode
          ? t('updatePatientSuccessSnackbarTitle', 'Patient Details Updated')
          : t('registerPatientSuccessSnackbarTitle', 'New Patient Created'),
        kind: 'success',
        isLowContrast: true,
      });
    } catch (error) {
      const fieldErrors = Object.entries(error.responseBody?.error?.fieldErrors || {}) as Array<
        [string, Array<{ code: string; message: string }>]
      >;

      if (savePatientTransactionManager.current.patientSaved) {
        helpers.resetForm({ values });
        setFormSavedSuccessfully((prev) => {
          setTimeout(() => {
            const patientUuid = values.patientUuid;
            const patientChartUrl = config.links?.submitButton
              ? interpolateUrl(config.links.submitButton, { patientUuid })
              : `\${openmrsSpaBase}/patient/${patientUuid}/chart`;

            if (inEditMode) {
              navigate({ to: patientChartUrl });
            } else {
              launchWorkspace('start-visit-workspace-form', {
                patientUuid: patientUuid,
                workspaceTitle: t('checkInPatientWorkspaceTitle', 'Check in patient'),
                closeWorkspace: () => {
                  closeWorkspace('start-visit-workspace-form', {
                    onWorkspaceClose: () => {
                      navigate({ to: patientChartUrl });
                    },
                    ignoreChanges: true,
                  });
                },
                closeWorkspaceWithSavedChanges: () => {
                  closeWorkspace('start-visit-workspace-form', {
                    onWorkspaceClose: () => {
                      navigate({ to: patientChartUrl });
                    },
                    ignoreChanges: true,
                  });
                },
              });
            }
          }, 100);

          return true;
        });

        fieldErrors.forEach(([field, error]) => {
          const errorMessage = error.map((e) => e.message).join(', ');
          showSnackbar({
            subtitle: errorMessage,
            title: `Patient registration successful, with errors for registration encounter`,
            kind: 'warning',
            timeoutInMs: 8000,
          });
        });
      }

      if (error.responseBody?.error?.globalErrors) {
        error.responseBody.error.globalErrors.forEach((error) => {
          showSnackbar({
            title: inEditMode
              ? t('updatePatientErrorSnackbarTitle', 'Patient Details Update Failed')
              : t('registrationErrorSnackbarTitle', 'Patient Registration Failed'),
            subtitle: error.message,
            kind: 'error',
          });
        });
      } else if (error.responseBody?.error?.message) {
        showSnackbar({
          title: inEditMode
            ? t('updatePatientErrorSnackbarTitle', 'Patient Details Update Failed')
            : t('registrationErrorSnackbarTitle', 'Patient Registration Failed'),
          subtitle: error.responseBody.error.message,
          kind: 'error',
        });
      } else {
        createErrorHandler()(error);
        console.error(error);
      }

      helpers.setSubmitting(false);
    }
  };

  const getDescription = (errors) => {
    return (
      <ul style={{ listStyle: 'inside' }}>
        {Object.keys(errors).map((error, index) => {
          return <li key={index}>{t(`${error}LabelText`, error)}</li>;
        })}
      </ul>
    );
  };

  const enableRegistryButton = healthInformationExchangeFlag ? false : !enableClientRegistry;

  const displayErrors = (errors) => {
    if (errors && typeof errors === 'object' && !!Object.keys(errors).length) {
      showSnackbar({
        isLowContrast: true,
        kind: 'warning',
        title: t('fieldsWithErrors', 'The following fields have errors:'),
        subtitle: <>{getDescription(errors)}</>,
      });
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={initialFormValues}
      validationSchema={validationSchema}
      onSubmit={onFormSubmit}>
      {(props) => {
        const touchedKeys = Object.keys(props.touched);
        const whenCondition = touchedKeys.length > 0 && !formSavedSuccessfully;

        return (
          <Form className={styles.form}>
            <BeforeSavePrompt when={whenCondition} redirect={target} />
            <div className={styles.formContainer}>
              <div>
                <div className={styles.stickyColumn}>
                  <h4>
                    {inEditMode
                      ? t('editPatientDetails', 'Edit patient details')
                      : t('createNewPatient', 'Create new patient')}
                  </h4>
                  {showDummyData && <DummyDataInput setValues={props.setValues} />}
                  <p className={styles.label01}>{t('jumpTo', 'Jump to')}</p>
                  {sections.map((section) => (
                    <div className={classNames(styles.space05, styles.touchTarget)} key={section.name}>
                      <Link className={styles.linkName} onClick={() => scrollIntoView(section.id)}>
                        <XAxis size={16} /> {t(`${section.id}Section`, section.name)}
                      </Link>
                    </div>
                  ))}
                  {!healthInformationExchangeFlag && (
                    <Button
                      renderIcon={ShareKnowledge}
                      disabled={!currentSession || !identifierTypes}
                      onClick={() => {
                        setEnableClientRegistry(true);
                        props.isValid
                          ? handleSavePatientToClientRegistry(props.values, props.setValues, inEditMode)
                          : props.validateForm().then((errors) => displayErrors(errors));
                      }}
                      className={styles.submitButton}>
                      {t('postToRegistry', 'Post to registry')}
                    </Button>
                  )}
                  <Button
                    className={styles.submitButton}
                    type="submit"
                    onClick={() => props.validateForm().then((errors) => displayErrors(errors))}
                    disabled={!currentSession || !identifierTypes || props.isSubmitting || enableRegistryButton}>
                    {props.isSubmitting ? (
                      <InlineLoading
                        className={styles.spinner}
                        description={`${t('submitting', 'Submitting')} ...`}
                        iconDescription="submitting"
                      />
                    ) : inEditMode ? (
                      t('updatePatient', 'Update patient')
                    ) : (
                      t('registerPatient', 'Register patient')
                    )}
                  </Button>
                  <Button className={styles.cancelButton} kind="tertiary" onClick={cancelRegistration}>
                    {t('cancel', 'Cancel')}
                  </Button>
                </div>
              </div>
              <div className={styles.infoGrid}>
                <PatientRegistrationContext.Provider
                  value={{
                    identifierTypes: identifierTypes,
                    validationSchema,
                    values: props.values,
                    inEditMode,
                    setFieldValue: props.setFieldValue,
                    setFieldTouched: props.setFieldTouched,
                    setCapturePhotoProps,
                    currentPhoto: photo?.imageSrc,
                    isOffline,
                    initialFormValues: props.initialValues,
                    setInitialFormValues,
                  }}>
                  {sections.map((section, index) => (
                    <SectionWrapper
                      key={`registration-section-${section.id}`}
                      sectionDefinition={section}
                      index={index}
                    />
                  ))}
                </PatientRegistrationContext.Provider>
              </div>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

/**
 * @internal
 * Just exported for testing
 */
export { exportedInitialFormValuesForTesting as initialFormValues };
