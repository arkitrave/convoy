/*
 * @depend json2.js
 * @depend underscore.js
 * @depend when.js
 * @depend notify.js
 * @depend app.js
 * @depend sandbox.js
 */

// TODO: Add localStorage and sessionStorage interfaces.

var Gilt;
if (!Gilt) {
  Gilt = {};
};

Gilt.commons = Gilt.commons || (function () {
  var

    /**
     * The list of allowed domains
     * @property domains
     * @type     {Array}
     * @private
     */
    domains = ['localhost.com'],

    /**
     * The list of allowed commons services to be accessed
     * @property possibleServices
     * @type     {Array}
     * @private
     */
    possibleServices = ['test'],

    /**
     * The object of sandboxes for the loaded services
     * @property services
     * @type     {Object}
     * @private
     */
    services = {},

    /**
     * Takes a commons service name string and initiates a load of that service's javascript file
     * @method loadService
     * @private
     * @param   {String} service The service name to load, maps to a javascript file
     * @return  {Object}         The promise to be fulfilled when the load event completes
     */
    loadService = function (service) {
      var
        deferred = when.defer(),
        loaded = 0,
        script = document.createElement('script'),
        head = document.getElementsByTagName('head')[0];

      if (!_.contains(possibleServices, service)) {
        deferred.reject(new Error('The requested service "' + service + '" is not permitted.'));
      } else if (typeof services[service] !== 'undefined') {
        deferred.resolve();
      } else {
        script.src = 'http://localhost:8888/xd/js/services/' + service + '.js';
        script.type = 'text/javascript';

        script.onload = script.onreadystatechange = function () {
          if ((script.readyState && script.readyState !== 'complete' && script.readyState !== 'loaded') || loaded) {
            return false;
          }
          script.onload = script.onreadystatechange = null;
          head.removeChild(script);
          loaded = 1;
          registerService(service);
          deferred.resolve();
        };

        head.appendChild(script);
      }

      return deferred.promise;
    },

    /**
     * Registers a loaded service with the app framework
     * @method registerService
     * @public as registerService
     * @param  {String} name    The name of the service being registered
     */
    registerService = function (name) {
      var id = Gilt.App.register(name, Gilt.commonsModules[name]);
      services[name] = Gilt.App.start(id);
    },

    /**
     * When a message is received from the client, passes the incoming data
     * and the deferred to be resolved into the appropriate commons service
     * @method handleData
     * @private
     * @param   {Object} data The event.data object of the incoming postMessage
     * @return  {Object}      The promise to be fulfilled when the service is loaded
     */
    handleData = function (data) {
      var deferred = when.defer();

      loadService(data.service).then(
        function () {
          services[data.service].publish('commonsRequest', [deferred, data]);
        },

        function () {
          deferred.reject();
        }
      );

      return deferred.promise;
    };

    window.addEventListener('message', function (event) {
      var isLegitDomain = _.find(domains, function (domain) {
        return event.origin.indexOf(domain) !== -1;
      });

      if (isLegitDomain) {
        handleData(JSON.parse(event.data)).then(
          function (result) {
            var ret = _.extend({}, JSON.parse(event.data));
            ret.response = result;
            event.source.postMessage(JSON.stringify(ret), event.origin);
          },

          function () {
            // Handle error condition
          }
        );
      }

    }, false);

  return {
    registerService : registerService
  };
}());
