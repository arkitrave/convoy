/*
 * Controller for app modules
 * TODO: This still will load every dependency of every possible module,
 * which is Not Good.
 */
createModule('src/x_domain_service',

['vendor/underscore', 'vendor/when', 'common/storage', 'common/app', 'config/jsBasePath'],

function (_, when, storage, app, jsBasePath) {
  var

    /**
     * The list of allowed commons apps to be accessed
     * @property possibleApps
     * @type     {Array}
     * @private
     */
    possibleApps = ['sso', 'preload'],

    /**
     * The object of sandboxes for the loaded apps
     * @property apps
     * @type     {Object}
     * @private
     */
    apps = {},

    /**
     * K/V of apps and their standard APIs
     * @property dependencies
     * @type     {Object}
     * @private
     */
    dependencies = {
      sso : {
        listen : listen,
        local : storage.local
      },
      preload : {
        listen : listen,
        session : storage.session
      }
    },

    /**
     * Takes a commons app name string and initiates a load of that app's javascript file
     * @method loadApp
     * @private
     * @param   {String} app The app name to load, maps to a javascript file
     * @return  {Object}     The promise to be fulfilled when the load event completes
     */
    loadApp = function (app) {
      var
        deferred = when.defer(),
        loaded = 0,
        script = document.createElement('script'),
        head = document.getElementsByTagName('head')[0];

      if (!_.contains(possibleApps, app)) {
        deferred.reject(new Error('The requested app "' + app + '" is not permitted.'));
      } else if (typeof apps[app] !== 'undefined') {
        deferred.resolve();
      } else {
        script.src = jsBasePath + '/src/apps/' + app + '.js';
        script.type = 'text/javascript';

        script.onload = script.onreadystatechange = function () {
          if ((script.readyState && script.readyState !== 'complete' && script.readyState !== 'loaded') || loaded) {
            return false;
          }
          script.onload = script.onreadystatechange = null;
          head.removeChild(script);
          loaded = 1;
          registerApp(app);
          deferred.resolve();
        };

        head.appendChild(script);
      }

      return deferred.promise;
    },

    /**
     * Registers a loaded app with the app framework
     * @method registerApp
     * @public as registerApp
     * @param  {String} name    The name of the app being registered
     */
    registerApp = function (name) {
      requireModules(['src/apps/' + name], function (a) {
        var id = app.register(name, a, {
          services : dependencies[name] || {}
        });

        apps[name] = app.start(id);
      });
    },

    /**
     * When a message is received from the client, passes the incoming data
     * and the deferred to be resolved into the appropriate commons app
     * @method handleRequest
     * @private
     * @param   {String} handle The handle to use for this request
     * @param   {Object} data   The event.data object of the incoming postMessage
     * @return  {Object}        The promise to be fulfilled when the app is loaded
     */
    handleRequest = function (handle, data) {
      var deferred = when.defer();

      loadApp(data.app).then(
        function () {
          apps[data.app].subscribe(handle + '/complete', function (res) {
            deferred.resolve(res);
          });
          apps[data.app].publish('commonsRequest', [handle, data]);
        },

        function () {
          deferred.reject();
        }
      );

      return deferred.promise;
    },

    /**
     * Normalizes listening to a window message event
     * @method listen
     * @private
     * @param   {Function} fn The function to execute when a window message comes in
     */
    listen = function (fn) {
      if (!window.postMessage) {
        return;
      }

      if (window.addEventListener) {
        window.addEventListener('message', fn, false);
      } else if (window.attachEvent) {
        window.attachEvent('onmessage', fn);
      }
    };

    listen(function (event) {
      var data = JSON.parse(event.data);

      handleRequest(data.handle, data).then(
        function (result) { // it doesn't get here when it fails
          var ret = _.extend({}, JSON.parse(event.data));
          ret.response = result;
          event.source.postMessage(JSON.stringify(ret), event.origin);
        },

        function () {
          // console.log('error');
          // Handle error condition
        }
      );
    });

  return {
  };
}

);
