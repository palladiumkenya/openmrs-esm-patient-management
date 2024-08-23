import React, { type Dispatch } from 'react';
import styles from './hie-client-registry.scss';
import { type FormikProps } from 'formik';
import { type FormValues } from '../../patient-registration/patient-registration.types';
import { useTranslation } from 'react-i18next';
import { Tile, ComboBox, Button, TextInput } from '@carbon/react';
import { Search } from '@carbon/react/icons';
import { useConfig } from '@openmrs/esm-framework';
import { type RegistrationConfig } from '../../config-schema';

type HIEClientRegistryProps = {
  props: FormikProps<FormValues>;
  setInitialFormValues: Dispatch<FormValues>;
};

const HIEClientRegistry: React.FC<HIEClientRegistryProps> = () => {
  const { t } = useTranslation();
  const {
    hieClientRegistry: { identifierTypes },
  } = useConfig<RegistrationConfig>();
  return (
    <div className={styles.hieContainer}>
      <h3 className={styles.productiveHeading02} style={{ color: '#161616' }}>
        {t('patientVerificationFromHIE', 'Patient verification from HIE')}
      </h3>
      <span className={styles.label01}>
        {t('allFieldsRequiredText', 'All fields are required unless marked optional')}
      </span>
      <Tile className={styles.grid}>
        <ComboBox
          light
          onChange={() => {}}
          id="identifier-combobox"
          items={identifierTypes}
          placeholder={t('selectIdentifierType', 'Select identifier type')}
          itemToString={(item) => (item ? item.identifierType : '')}
          titleText={t('identifierType', 'Identifier type')}
        />
        <TextInput
          light
          id="identifier-search"
          placeholder={t('enterIdentifierSearchValue', 'Enter identifier search value')}
          type="text"
          labelText={t('identifierSearch', 'Identifier search')}
        />
        <Button
          renderIcon={(props) => <Search size={24} {...props} />}
          iconDescription={t('searchRegistry', 'Search registry')}
          size="md"
          kind="secondary">
          {t('search', 'Search')}
        </Button>
      </Tile>
    </div>
  );
};

export default HIEClientRegistry;
