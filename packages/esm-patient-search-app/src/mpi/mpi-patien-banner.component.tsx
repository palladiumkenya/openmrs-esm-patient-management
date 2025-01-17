import React, { useMemo, useState } from 'react';
import { type SearchedPatient } from '../types';
import trim from 'lodash-es/trim';
import {
  DataTable,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Tile,
  Layer,
  Pagination,
} from '@carbon/react';
import styles from './mpi-patient-banner.scss';
import { useTranslation } from 'react-i18next';
import { maskName } from './utils';
import EmptyDataIllustration from '../ui-components/empty-data-illustration.component';
import { usePagination } from '@openmrs/esm-framework';
import { usePaginationInfo } from '@openmrs/esm-patient-common-lib';

type MpiPatientBannerProps = {
  patient: SearchedPatient;
};

const MpiPatientBanner = ({ patient }: MpiPatientBannerProps) => {
  const { t } = useTranslation();
  const [pageSize, setPageSize] = useState(5);
  const headers = [
    {
      key: 'name',
      header: 'Name',
    },
    {
      key: 'phoneNumber',
      header: 'Phone Number',
    },
    {
      key: 'identifier',
      header: 'Identifier',
    },
    {
      key: 'relationship',
      header: 'Relationship',
    },
  ];
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

  const { results, goTo, currentPage } = usePagination(dependentsInfo, pageSize);
  const { pageSizes } = usePaginationInfo(pageSize, dependentsInfo.length, currentPage, results.length);

  const rows = useMemo(() => {
    return results.map((dependent) => {
      return {
        id: dependent.name,
        name: maskName(dependent.name),
        phoneNumber: dependent.phoneNumber,
        identifier: (
          <>
            <span className={styles.identifierType}>{dependent.identifier[0].identifierType}</span>
            <span className={styles.identifierValue}>{dependent.identifier[0].identifier}</span>
          </>
        ),
        relationship: dependent.relationShip,
      };
    });
  }, [results]);

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
      <DataTable size="xs" useZebraStyles rows={rows} headers={headers}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>{cell.value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTable>
      <Pagination
        currentItems={results.length}
        totalItems={dependentsInfo.length}
        pageNumber={currentPage}
        pageSize={pageSize}
        pageSizes={pageSizes}
        onChange={({ page }) => goTo(page)}
        size="sm"
      />
    </div>
  );
};

export default MpiPatientBanner;
