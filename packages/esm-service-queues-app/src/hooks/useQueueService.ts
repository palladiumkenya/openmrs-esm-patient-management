import { getLocale } from '@openmrs/esm-framework';
import { useMemo } from 'react';
import { useQueues } from './useQueues';
import uniqBy from 'lodash-es/unionBy';

function useQueueServices() {
  const { queues, isLoading } = useQueues();
  const results = useMemo(
    () => ({
      services: uniqBy([...new Set(queues?.map((queue) => queue.service) ?? [])], (s) => s.uuid).sort((a, b) =>
        a.display.localeCompare(b.display, getLocale()),
      ),
      isLoadingQueueServices: isLoading,
    }),
    [queues, isLoading],
  );

  return results;
}

export default useQueueServices;
