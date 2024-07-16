import { getLocale } from '@openmrs/esm-framework';
import { useMemo } from 'react';
import { useQueues } from './useQueues';

function useQueueServices(locationUuid?: string) {
  const { queues, isLoading } = useQueues(locationUuid);

  const results = useMemo(
    () => ({
      services: [...new Set(queues?.map((queue) => queue.service) ?? [])].sort((a, b) =>
        a.display.localeCompare(b.display, getLocale()),
      ),
      isLoadingQueueServices: isLoading,
    }),
    [queues, isLoading],
  );

  return results;
}

export default useQueueServices;
