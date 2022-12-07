import React from 'react';
import { Layer, Tile } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import styles from './empty-state.scss';

export interface CommingSoon {}

export const CommingSoon: React.FC<CommingSoon> = () => {
  const { t } = useTranslation();

  return (
    <Layer>
      <Tile className={styles.tile}>
        <div>
          <h4 className={styles.header4}>Comming soon</h4>
        </div>
        <svg width={61} height={61} viewBox="0 0 61 59">
          <title>Empty data illustration</title>
          <g fill="none" fillRule="evenodd">
            <path
              d="M38.133 13.186H21.947c-.768.001-1.39.623-1.39 1.391V50.55l-.186.057-3.97 1.216a.743.743 0 01-.927-.493L3.664 12.751a.742.742 0 01.492-.926l6.118-1.874 17.738-5.43 6.119-1.873a.741.741 0 01.926.492L38.076 13l.057.186z"
              fill="#E0E0E0"
            />
            <path
              d="M41.664 13L38.026 1.117A1.576 1.576 0 0036.056.07l-8.601 2.633-17.737 5.43-8.603 2.634a1.578 1.578 0 00-1.046 1.97l12.436 40.616a1.58 1.58 0 001.969 1.046l5.897-1.805.185-.057v-.194l-.185.057-5.952 1.822a1.393 1.393 0 01-1.737-.923L.247 12.682a1.39 1.39 0 01.923-1.738L9.772 8.31 27.51 2.881 36.112.247a1.393 1.393 0 011.737.923L41.47 13l.057.186h.193l-.057-.185z"
              fill="#8D8D8D"
            />
            <path
              d="M11.378 11.855a.836.836 0 01-.798-.59L9.385 7.361a.835.835 0 01.554-1.042l16.318-4.996a.836.836 0 011.042.554l1.195 3.902a.836.836 0 01-.554 1.043l-16.318 4.995a.831.831 0 01-.244.037z"
              fill="#C6C6C6"
            />
            <circle fill="#C6C6C6" cx={17.636} cy={2.314} r={1.855} />
            <circle fill="#FFF" fillRule="nonzero" cx={17.636} cy={2.314} r={1.175} />
            <path
              d="M55.893 53.995H24.544a.79.79 0 01-.788-.789V15.644a.79.79 0 01.788-.788h31.349a.79.79 0 01.788.788v37.562a.79.79 0 01-.788.789z"
              fill="#E0E0E0"
            />
            <path
              d="M41.47 13H21.948a1.579 1.579 0 00-1.576 1.577V52.4l.185-.057V14.577c.001-.768.623-1.39 1.391-1.39h19.581L41.471 13zm17.02 0H21.947a1.579 1.579 0 00-1.576 1.577v42.478c0 .87.706 1.576 1.576 1.577H58.49a1.579 1.579 0 001.576-1.577V14.577a1.579 1.579 0 00-1.576-1.576zm1.39 44.055c0 .768-.622 1.39-1.39 1.392H21.947c-.768-.001-1.39-.624-1.39-1.392V14.577c0-.768.622-1.39 1.39-1.39H58.49c.768 0 1.39.622 1.39 1.39v42.478z"
              fill="#8D8D8D"
            />
            <path
              d="M48.751 17.082H31.686a.836.836 0 01-.835-.835v-4.081c0-.46.374-.834.835-.835H48.75c.461 0 .834.374.835.835v4.08c0 .462-.374.835-.835.836z"
              fill="#C6C6C6"
            />
            <circle fill="#C6C6C6" cx={40.218} cy={9.755} r={1.855} />
            <circle fill="#FFF" fillRule="nonzero" cx={40.218} cy={9.755} r={1.13} />
          </g>
        </svg>
        <p className={styles.content}>Under development</p>
      </Tile>
    </Layer>
  );
};

export default CommingSoon;
