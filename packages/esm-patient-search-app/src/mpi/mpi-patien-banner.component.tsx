import React from 'react';
import { type SearchedPatient } from '../types';
import trim from 'lodash-es/trim';
import {
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
  Tag,
  Tile,
  Layer,
} from '@carbon/react';
import styles from './mpi-patient-banner.scss';
import { useTranslation } from 'react-i18next';
import { maskName } from './utils';
import EmptyDataIllustration from '../ui-components/empty-data-illustration.component';

type MpiPatientBannerProps = {
  patient: SearchedPatient;
};

const MpiPatientBanner = ({ patient }: MpiPatientBannerProps) => {
  const { t } = useTranslation();
  const contact = patient?.contact;
  const dependentsInfo =
    contact
      ?.filter((contact) => contact.extension.some((extension) => extension.url === 'identifiers'))
      ?.map((contact) => {
        return {
          name: trim(contact.name?.['text'] ?? contact.name?.['given'] ?? contact.name?.['family']) ?? '',
          phoneNumber: contact.telecom?.map((telecom) => telecom.value)?.join(', ') ?? '--',
          identifier: contact.extension
            ?.map((extension) => {
              return {
                identifier: extension.valueIdentifier?.value,
                identifierType: extension.valueIdentifier?.type.coding?.map((coding) => coding.display)?.join(' '),
              };
            })
            .filter(({ identifier }) => identifier != null)
            .slice(0, 1),
          relationShip:
            contact?.['relationship']
              ?.map((relationship) => relationship?.coding?.map((code) => code?.display).join(' '))
              ?.join(' ') ?? '--',
        };
      }) ?? [];

  if (dependentsInfo.length === 0) {
    return (
      <div className={styles.searchResultsContainer}>
        <div className={styles.searchResults}>
          <Layer>
            <Tile className={styles.emptySearchResultsTile}>
              <EmptyDataIllustration />
              <p className={styles.emptyResultText}>
                {t('noDependentsFoundMessage', 'Sorry, no dependents were found')}
              </p>
              <p className={styles.actionText}>
                <span>{t('registerDependentsWithSHA', 'Register dependents with SHA to search for them')}</span>
              </p>
            </Tile>
          </Layer>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mpiPatientBanner}>
      <StructuredListWrapper isCondensed>
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>{t('name', 'Name')}</StructuredListCell>
            <StructuredListCell head>{t('phoneNumber', 'Phone Number')}</StructuredListCell>
            <StructuredListCell head>{t('identifier', 'Identifier')}</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {dependentsInfo.map((dependents) => {
            return (
              <StructuredListRow>
                <StructuredListCell>{maskName(dependents.name)}</StructuredListCell>
                <StructuredListCell>{dependents.phoneNumber}</StructuredListCell>
                <StructuredListCell>
                  <Tag type="blue">{dependents.identifier.map((identifier) => identifier.identifierType)}</Tag>
                  {dependents.identifier.map((identifier) => identifier.identifier)}
                </StructuredListCell>
              </StructuredListRow>
            );
          })}
        </StructuredListBody>
      </StructuredListWrapper>
    </div>
  );
};

export default MpiPatientBanner;
