import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockMappedAppointmentsData } from '../../../../__mocks__/appointments.mock';
import { renderWithSwr } from '../../../../tools/test-helpers';
import QueuePatientBaseTable from './queue-linelist-base-table.component';
import { usePagination } from '@openmrs/esm-framework';

const mockUsePagination = usePagination as jest.Mock;
const mockGoToPage = jest.fn();

const tableHeaders = [
  {
    id: 0,
    header: 'Name',
    key: 'name',
  },
  {
    id: 1,
    header: 'Return Date',
    key: 'returnDate',
  },
  {
    id: 2,
    header: 'Gender',
    key: 'gender',
  },
  {
    id: 3,
    header: 'Age',
    key: 'age',
  },
  {
    id: 4,
    header: 'Visit Type',
    key: 'visitType',
  },
  {
    id: 5,
    header: 'Phone Number',
    key: 'phoneNumber',
  },
];

const testProps = {
  title: 'Scheduled appointments',
  patientData: mockMappedAppointmentsData.data,
  headers: tableHeaders,
  serviceType: '',
  isLoading: false,
};

jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');
  return {
    ...originalModule,
    openmrsFetch: jest.fn(),
    usePagination: jest.fn(),
  };
});

describe('QueuePatientBaseTable: ', () => {
  it('renders a tabular overview of appointments data when available', async () => {
    const user = userEvent.setup();

    mockUsePagination.mockReturnValue({
      results: testProps.patientData,
      goTo: mockGoToPage,
      currentPage: 1,
    });

    renderQueueBaseTable();

    expect(screen.queryByText(/scheduled appointments/i)).toBeInTheDocument();
    const expectedColumnHeaders = [/name/, /return date/, /gender/, /age/, /visit type/, /phone number/];
    expectedColumnHeaders.forEach((header) => {
      expect(screen.getByRole('columnheader', { name: new RegExp(header, 'i') })).toBeInTheDocument();
    });

    const expectedTableRows = [
      /john wilson 08 — Oct — 1632, 12:00\s+AM M 35 walkin 0700000000/,
      /charles babbage 13 — Jul — 1635, 12:00\s+AM M 35 walkIn 0700000001/,
      /neil amstrong 21 — May — 1633, 12:00\s+AM M 35 walkIn 0700000002/,
      /elon musketeer 27 — Jan — 1636, 12:00\s+AM M 35 walkIn 0700000000/,
    ];

    expectedTableRows.forEach((row) => {
      expect(screen.queryByRole('row', { name: new RegExp(row, 'i') })).not.toBeInTheDocument();
    });

    const searchBox = screen.getByRole('searchbox');
    await user.type(searchBox, 'John');

    expect(screen.queryByText(/john wilson/i)).toBeInTheDocument();
    expect(screen.queryByText(/eric test ric/i)).not.toBeInTheDocument();

    await user.clear(searchBox);
    await user.type(searchBox, 'gibberish');
    expect(screen.queryByText(/john wilson/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/eric test ric/i)).not.toBeInTheDocument();
  });
  it('renders an empty state view if data is unavailable', async () => {
    mockUsePagination.mockReturnValue({
      results: [],
      goTo: mockGoToPage,
      currentPage: 1,
    });

    renderQueueBaseTable();

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText(/scheduled appointments/i)).toBeInTheDocument();
    expect(screen.getByText(/no patients to display/i)).toBeInTheDocument();
  });
});

function renderQueueBaseTable() {
  renderWithSwr(<QueuePatientBaseTable {...testProps} />);
}
