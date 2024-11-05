import { useEffect, useCallback, useRef, useMemo, useContext } from 'react';
import { deleteIdentifierType, initializeIdentifier } from '../id/id-field.component';
import { ResourcesContext } from '../../../offline.resources';

const useUpdateIdentifierRequirement = (setFieldValue, values) => {
  const { identifierTypes = [] } = useContext(ResourcesContext);
  const previousAttributes = useRef(values.attributes);
  const previousIdentifiers = useRef(values.identifiers);

  const publicationNumberIdentifier = useMemo(
    () => identifierTypes?.find((identifier) => identifier.name === 'Publication Number'),
    [identifierTypes],
  );

  // Memoize the civilian check
  const isCivilian = useMemo(() => Object.values(values.attributes ?? {}).includes('Civilian'), [values.attributes]);

  // Memoize the identifier initialization logic
  const initializePublicationIdentifier = useCallback(
    (currentIdentifiers) => {
      if (!publicationNumberIdentifier) {
        console.warn('Publication Number identifier type not found');
        return null;
      }

      const initializedIdentifier = initializeIdentifier(
        publicationNumberIdentifier,
        currentIdentifiers[publicationNumberIdentifier.uuid],
      );

      return initializedIdentifier;
    },
    [publicationNumberIdentifier],
  );
  // Only run the effect if isCivilian is true
  useEffect(() => {
    // Skip if we don't have the required data
    if (!values.attributes || !publicationNumberIdentifier) {
      return;
    }

    // Check if relevant values have actually changed
    const attributesChanged = previousAttributes.current !== values.attributes;
    const identifiersChanged = previousIdentifiers.current !== values.identifiers;

    if (!attributesChanged && !identifiersChanged) {
      return;
    }

    // Update refs
    previousAttributes.current = values.attributes;
    previousIdentifiers.current = values.identifiers;
    const isDependant = Object.values(values.attributes ?? {}).includes('Dependant');
    // Only proceed if the user is a civilian
    if (isCivilian && isDependant) {
      const initializedIdentifier = initializePublicationIdentifier(values.identifiers);

      // check if values.identifiers already has the publication number identifier
      const hasPublicationNumberIdentifier = values.identifiers[publicationNumberIdentifier.fieldName];

      if (initializedIdentifier && !hasPublicationNumberIdentifier) {
        setFieldValue('identifiers', {
          ...values.identifiers,
          [publicationNumberIdentifier.fieldName]: { ...initializedIdentifier, required: true },
        });
      }
    } else {
      // Before deleting the publication number identifier, check if it exists
      if (values.identifiers[publicationNumberIdentifier.fieldName]) {
        setFieldValue('identifiers', deleteIdentifierType(values.identifiers, publicationNumberIdentifier.fieldName));
      }
    }
  }, [
    values.attributes,
    values.identifiers,
    isCivilian,
    publicationNumberIdentifier,
    initializePublicationIdentifier,
    setFieldValue,
  ]);
};

export default useUpdateIdentifierRequirement;
