var Gilt;
if (!Gilt) {
  Gilt = {};
}

Gilt.commonsModules = Gilt.commonsModules || {};

Gilt.commonsModules.test = function (sandbox) {
  var

    /**
     * The name of this service
     * @const SERVICE_NAME
     * @private
     */
    SERVICE_NAME = 'test',

    /**
     * Whether the user has local storage
     * @property hasLocalStorage
     * @private
     */
    hasLocalStorage = !!window.localStorage,

    /**
     * The methods available to the client API
     * @property methods
     * @private
     */
    methods = {

      /**
       * Places a message into local storage
       * @method publish
       * @private
       * @param   {String} message A message to store
       */
      publish : function (message) {
        if (hasLocalStorage) {
          window.localStorage.setItem(SERVICE_NAME, message);
        }
      },

      /**
       * Retrieves a message from local storage
       * @method fetch
       * @private
       * @return  {String} The requested item from local storage
       */
      fetch : function () {
        if (hasLocalStorage) {
          return window.localStorage.getItem(SERVICE_NAME);
        }
      }
    },

    /**
     * Default handler for all incoming pubsub requests
     * @method handleRequest
     * @private
     * @param   {Object} deferred The deferred that this module is responsible for resolving
     * @param   {Object} data     The data that contains the method and params for this request
     */
    handleRequest = function (deferred, data) {
      var result = '';

      if (typeof methods[data.method] === 'function') {
        result = methods[data.method].apply(this, data.params);
        deferred.resolve(result);
      }
    },

    /**
     * Creates.
     * @method create
     * @public as create
     */
    create = function () {
      sandbox.subscribe('commonsRequest', handleRequest);
    },

    /**
     * Destroys.
     * @method destroy
     * @public as destroy
     */
    destroy = function () {
      //console.log('destroyed');
    };

  return {
    create : create,
    destroy : destroy
  };
};
