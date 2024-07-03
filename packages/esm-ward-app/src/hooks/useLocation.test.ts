<<<<<<< HEAD
import { renderHook } from '@testing-library/react';
=======
import { cleanup, renderHook } from '@testing-library/react';
>>>>>>> 27abf9cb ((fix) O3-3533 & O3-3535: Improvements to previous implementation for O3-3224 (#1217))
import useLocation from './useLocation';
import useSWRImmutable from 'swr/immutable';
import { restBaseUrl } from '@openmrs/esm-framework';

jest.mock('swr/immutable', () =>
  jest.fn().mockReturnValue({
    data: {},
    error: null,
    isValidating: false,
    mutate: jest.fn(),
  }),
);

const useSWRImmutableMock = useSWRImmutable as jest.Mock;

<<<<<<< HEAD
describe('useLocation hook', () => {
=======
describe('Testing useLocation', () => {
  beforeEach(() => {
    cleanup();
  });

>>>>>>> 27abf9cb ((fix) O3-3533 & O3-3535: Improvements to previous implementation for O3-3224 (#1217))
  it('should call useLocation', () => {
    const { result } = renderHook(() => useLocation('testUUID'));
    expect(useSWRImmutableMock).toHaveBeenCalledWith(
      `${restBaseUrl}/location/testUUID?v=custom:(display,uuid)`,
      expect.any(Function),
    );
  });

  it('should call useLocation with given rep', () => {
    const { result } = renderHook(() => useLocation('testUUID', 'custom:(display,uuid,links)'));
    expect(useSWRImmutableMock).toHaveBeenCalledWith(
      `${restBaseUrl}/location/testUUID?v=custom:(display,uuid,links)`,
      expect.any(Function),
    );
  });

  it('should call useSWR with key=null', () => {
    const { result } = renderHook(() => useLocation(null, 'custom:(display,uuid,links)'));
    expect(useSWRImmutableMock).toHaveBeenCalledWith(null, expect.any(Function));
  });
});
