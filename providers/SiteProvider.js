import React from 'react';

const SITE_CONTEXT_KEY = '__SITE_CONTEXT';
const SiteContext = React.createContext();
const __useSiteContext = () => React.useContext(SiteContext);

const useSiteContext = () => {
  const [isReady, setIsReady] = React.useState(false);
  const siteContext = __useSiteContext();
  const isClientSideRendered = typeof window !== 'undefined';

  React.useEffect(() => {
    if (isClientSideRendered) {
      setIsReady(true);
    }
  }, [isClientSideRendered]);

  const globalState = isClientSideRendered ? window[SITE_CONTEXT_KEY] : {};

  return siteContext || globalState || {};
};

export { SiteContext, useSiteContext };

export const SiteProvider = ({ site, params, children }) => {
  const [contextProps] = React.useState({ ...site, params });

  React.useEffect(() => {
    window[SITE_CONTEXT_KEY] = contextProps;
  }, [contextProps]);

  return (
    <SiteContext.Provider value={contextProps}>{children}</SiteContext.Provider>
  );
};
