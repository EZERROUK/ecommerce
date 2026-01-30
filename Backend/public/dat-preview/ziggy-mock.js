// Généré automatiquement pour la prévisualisation DAT (captures)
(() => {
  const routesProxy = new Proxy({}, {
    get: (_t, prop) => ({
      uri: String(prop).replace(/\./g, '/'),
      methods: ['GET', 'HEAD'],
      domain: null,
      parameters: [],
    }),
    has: () => true,
  });

  window.Ziggy = {
    url: window.location.origin,
    port: null,
    defaults: {},
    routes: routesProxy,
  };
})();
