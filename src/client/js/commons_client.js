var Gilt;
if (!Gilt) {
  Gilt = {};
}

Gilt.commonsClient = (function () {
  var

    FRAME_ID = 'commons-frame',
    FRAME_DOMAIN = 'http://localhost:8888/',
    frame = null,
    started = false,
    postQueue = [],

    /**
     * Creates the iframe and sets up the load event
     * @method init
     * @public as init
     */
    init = function () {
      var iframe = createFrame();
      iframe.onload = function () {
        started = true;
        frame = document.getElementById(FRAME_ID).contentWindow;
        flushPostQueue();
      }
    },

    /**
     * Creates an iframe and appends it to the document body
     * @method createFrame
     * @private
     * @return  {DOMElement} The newly created iframe
     */
    createFrame = function () {
      var iframe = document.createElement('iframe');

      iframe.id = 'commons-frame';
      iframe.src = FRAME_DOMAIN + 'index.html';
      iframe.width = 346;
      iframe.height = 400;

      document.getElementsByTagName('body')[0].appendChild(iframe);

      return iframe;
    },

    /**
     * Fires off post calls for everything in the queue
     * @method flushPostQueue
     * @private
     */
    flushPostQueue = function () {
      var i;

      for (i = 0; i < postQueue.length; i += 1) {
        makePost(postQueue[i]);
      }
    },

    /**
     * Pushes a data object into the queue of posts to be made
     * @method queuePost
     * @private
     * @param   {Object} postData The object of data to be posted
     */
    queuePost = function (postData) {
      postQueue.push(postData);
    },

    /**
     * Directly posts a message to the frame given a data object
     * @method makePost
     * @private
     * @param   {Object} postData The object of data to be posted
     */
    makePost = function (postData) {
      frame.postMessage(JSON.stringify(postData), FRAME_DOMAIN);
    },

    /**
     * Takes params, transforms to a data object to be posted, and queues or makes the post
     * @method post
     * @public as post
     * @param  {String} service The commons service targeted by the post
     * @param  {String} method  The method to be invoked in the commons service requested
     * @param  {Array}  params  The params to be sent to the method, or empty, defaults to []
     */
    post = function (service, method, params) { // TODO: Queue up calls to post until iframe load event fires, then flush?
      var postData = {
        service : service,
        method : method,
        params : params || []
      };

      if (!started) {
        queuePost(postData);
      } else {
        makePost(postData);
      }
    };

    window.addEventListener('message', function (event) {
      var obj = {};

      if (typeof event.data !== 'undefined') {
        obj = JSON.parse(event.data);
      }

      if (event.origin.indexOf('localhost') !== -1) {
        if (obj.response) {
          console.log('Service: ' + obj.service + ' // Method: ' + obj.method + ' // Message: ' + obj.response);
        }
      }
    }, false);

  return {
    post : post,
    init : init
  };
}());