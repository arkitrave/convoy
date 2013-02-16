createModule('src.apps.sso',

[],

function () {
  return function (sandbox) {
    var

      /**
       * The name of this app
       * @const APP_NAME
       * @private
       */
      APP_NAME = 'sso',

      /**
       * The methods available to the client
       * @property apiMethods
       * @private
       */
      apiMethods = {

        /**
         * Logs a user out. Takes a site, but for now, we will clear
         * all the things, which is webstorage for now, choosing
         * to leave active sessions on other sites intact.
         * @method logout
         * @private
         * @param   {String} handle The handle to use for the publish event when finished
         * @param   {String} site   The site (domain) from which to log out
         */
        logout : function (handle, site) {
          sandbox.getService('local').collection('user').remove();

          sandbox.publish(handle + '/complete', [{ success: true }]);
        },

        /**
         * Logs in a user on the convoy domain
         * @method login
         * @private
         * @param   {String} handle                 The handle to use for the publish event when finished
         * @param   {String} site                   The site (domain) to record the login for
         * @param   {Object} data                   Data required in order to complete the login
         * @param   {String} data.guid              The guid of the user
         * @param   {Number} [data.cp]              The partition of the user
         * @param   {Number} [data.test_bucket_id]  The test_bucket_id of the user
         */
        login : function (handle, site, data) {
          var
            local = sandbox.getService('local');

          local.lru('sites').set(site);
          local.collection('user').set('guid', data.guid);

          if (typeof data.cp === 'number') {
            local.collection('user').set('cp', data.cp);
          }

          if (data.test_bucket_id) {
            local.collection('user').set('test_bucket_id', data.test_bucket_id);
          }

          sandbox.publish(handle + '/complete', [{ success: true }]);
        },

        /**
         * Gets the guid and other login information of any user who is logged
         * in on the current machine
         * @method getLogin
         * @private
         * @param   {String} handle The handle to use for the publish event when finished
         */
        getLogin : function (handle) {
          var local = sandbox.getService('local');

          if (local.collection('user').get('guid') && typeof local.collection('user').get('cp') === 'number') {
            sandbox.publish(handle + '/complete', [{
              guid : local.collection('user').get('guid'),
              cp : local.collection('user').get('cp'),
              test_bucket_id : local.collection('user').get('test_bucket_id')
            }]);
          } else {
            sandbox.publish(handle + '/complete', []);
          }
        }
      },

      /**
       * Default handler for all incoming pubsub requests
       * @method handleRequest
       * @private
       * @param   {Object} handle   The handle this module uses for the publish event when it finishes
       * @param   {Object} data     The data that contains the method and params for this request
       */
      handleRequest = function (handle, data) {
        var
          params = data.params;

        params.unshift(handle);

        if (typeof apiMethods[data.method] === 'function') {
          apiMethods[data.method].apply(null, params); // assuming async now
        }
      },

      /**
       * Creates.
       * @method create
       * @public
       */
      create = function () {
        sandbox.subscribe('commonsRequest', handleRequest);
      },

      /**
       * Destroys.
       * @method destroy
       * @public
       */
      destroy = function () {
        sandbox.unsubscribeAll();
      };

    return {
      create : create,
      destroy : destroy
    };
  };
}

);
