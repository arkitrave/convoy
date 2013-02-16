createModule('src.apps.preload',

[],

function () {
  return function (sandbox) {
    var

      /**
       * The name of this app
       * @const APP_NAME
       * @private
       */
      APP_NAME = 'preload',

      loadJs = function (path) {
        var script = document.createElement('script');
        script.src = path;
        document.body.appendChild(script);
      },

      loadCss = function (path) {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = path;
        document.head.appendChild(link);
      },

      loadImg = function (path) {
        var img = document.createElement('img');
        img.src = path;
        document.body.appendChild(img);
      },

      /**
       * The methods available to the client
       * @property apiMethods
       * @private
       */
      apiMethods = {

        /**
         * Preloads a set of resources
         * @method preload
         * @private
         * @param   {String} handle     The handle to use for the publish event when finished
         * @param   {Array}  resources  The list of resources to preload
         */
        fetch : function (handle, resources) {
          var
            i,
            il,
            resource,
            session = sandbox.getService('session');

          if (typeof resources === 'string') {
            resources = [resources];
          }

          for (i = 0, il = resources.length; i < il; i += 1) {
            resource = resources[i].split('?')[0];

            switch (resource.match(/\.([^?\.]*)$/)[1]) { // match on the non-query-string version
            case 'jpg' :
              loadImg(resources[i]); // still loads what was asked for
              break;
            case 'gif' :
              loadImg(resources[i]);
              break;
            case 'png' :
              loadImg(resources[i]);
              break;
            case 'js' :
              loadJs(resources[i]);
              break;
            case 'css' :
              loadCss(resources[i]);
            }
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
