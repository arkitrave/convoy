var Gilt;
if (!Gilt) {
  Gilt = {};
}

Gilt.commonsClient = (function () {
  var

    /**
     * The DOM id for the iframe
     * @const FRAME_ID
     * @private
     */
    FRAME_ID = 'commons-frame',

    /**
     * The domain for the iframe
     * @const FRAME_DOMAIN
     * @private
     */
    FRAME_DOMAIN = 'http://localhost:8888/',

    /**
     * Reference to the frame's content window for all methods to use
     * @property frame
     * @private
     */
    frame = null,

    /**
     * Whether or not the iframe has been initialized and is ready
     * @property started
     * @private
     */
    started = false,

    /**
     * A list of post requests waiting to be flushed when the iframe is ready
     * @property postQueue
     * @private
     */
    postQueue = [],

    /**
     * An object of post requests including their callbacks, stored by post handle
     * @property handles
     * @private
     */
    handles = {},

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
     * Generates a unique handle to use for a client post request
     * @method generateHandle
     * @private
     * @return  {String} A unique handle to use as a key for storage
     */
    generateHandle = function () {
      return 'h' + new Date().getTime() + parseInt(Math.random()*100000000000, 10);
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
      iframe.src = FRAME_DOMAIN + 'xd/index.html';
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
      var handle = generateHandle();
      postData.handle = handle;
      handles[handle] = postData;
      frame.postMessage(JSON.stringify(postData), FRAME_DOMAIN);
    },

    /**
     * Takes params, transforms to a data object to be posted, and queues or makes the post
     * @method post
     * @public as post
     * @param  {String}   service  The commons service targeted by the post
     * @param  {String}   method   The method to be invoked in the commons service requested
     * @param  {Array}    params   The params to be sent to the method, or empty, defaults to []
     * @param  {Function} callback The callback to run after the post completes
     */
    post = function (service, method, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }

      var postData = {
        service : service,
        method : method,
        params : params || [],
        callback : callback
      };

      if (!started) { // eventually don't make the client init, but then we have to keep track of that too...
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
        if (typeof handles[obj.handle].callback === 'function') {
          handles[obj.handle].callback(obj.response);
        }
      }
    }, false);

  return {
    post : post,
    init : init
  };
}());