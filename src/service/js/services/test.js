var Gilt;
if (!Gilt) {
  Gilt = {};
}

(function () {
  var test = (function () {

    var
      SERVICE_NAME = 'test',
      hasLocalStorage = !!window.localStorage,
      commons = Gilt.commons,

      publish = function (message) {
        if (hasLocalStorage) {
          window.localStorage.setItem(SERVICE_NAME, message);
        }
        return message;
      },

      fetch = function () {
        if (hasLocalStorage) {
          var result = window.localStorage.getItem(SERVICE_NAME);
          return result;
        }
      };

    return {
      publish : publish,
      fetch : fetch
    }
  }());

  Gilt.commons.registerService('test', test);
}());
