function getGmailChannel () {
  'use strict'
  /**
  *
  * GmailChannel - Pub/Sub & Middleware framework for easy dealing with Gmails by Channel
  *
  * GmailChannel provide a easy way to filter out the emails in gmail by search options to a named Channel,
  * then you could Sub to this Channel, and use Middleware to process them.
  *
  * Github - https://github.com/zixia/gas-gmail-channel
  *
  * Example:
  ```javascript
  if ((typeof GmailChannel)==='undefined') { // GmailChannel Initialization. (only if not initialized yet.)
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-gmail-channel/master/src/gas-gmail-channel-lib.js').getContentText())
  } // Class GmailChannel is ready for use now!

  var testChannel = new GmailChannel({
    keywords: ['the', '-abcdefghijilmn']
    , labels: ['inbox', '-trash']
    , limit: 1
    , doneLabel: 'OutOfGmailChannel'
  })

  testChannel.use(
    function (req, res, next) {
      Logger.log(req.thread.getFirstMessageSubject())
      req.data = 'set'
      next()
    }
    , function (req, res, next) {
      Logger.log('req.data got: ' + req.data)
      // NO next() here
    }
    , function (req, res,next) {
      throw Error('should not run to here')
    }
  )

  testChannel.done(function(req, res, next) {
    Logger.log('finalize after middlewares')
  })
  ```
  */

  var VERSION = '0.2.0'

  var DEFAULT = {
    name: 'GmailChannel v' + VERSION
    , labels: ['inbox', '-trash']
    , dayspan: '365'   // only check in last 365 days
    , limit: 500       // default max return 999 threads
    , doneLabel: null
    , conversation: true // conversation mode
    , keywords: []
    , res: JSON.parse('{}') // use {} directory will cause script editor indient error???
  }

  /************************************************************************************************
  *
  * Class GmailChannel
  * ------------------
  *
  * @param object optoins
  *    options.name string Channel Name
  *    options.labels array gmail channel labels. default: label:inbox label:unread -label:trash
  *    optoins.keywords array gmail search keywords
  *
  *    options.query string gmail search query string
  *    options.dayspan number newer_than:{{dayspan}}d
  *    options.limit number no more then {{limit}} results
  *
  *    options.conversation `true` for deal with threads, `false` for deal with each messages. DEFAULT `true`
  *
  *    options.doneLabel message labeled with {{doneLabel}} will be ignored
  */
  var GmailChannel = function (options) {

    if (!options) throw Error('options must be defined for GmailChannel!')

    var labels = options.labels || DEFAULT.labels
    var name = options.name || DEFAULT.name
    var res = options.res || DEFAULT.res
    var keywords = options.keywords || DEFAULT.keywords
    var limit = options.limit || DEFAULT.limit

    /**
    *
    * 1. if we don't set doneLabel/dayspan, then it should be the default label name.
    * 2. but if we set it to null, then we will not use doneLabel/dayspan anymore.
    *
    * so we use "typeof options.doneLabel === 'undefined'" to check if use defined it.
    *
    */
    if ((typeof options.doneLabel)==='undefined') {
      var doneLabel = DEFAULT.doneLabel;
    } else {
      doneLabel = options.doneLabel
    }

    if ((typeof options.dayspan)==='undefined') {
      var dayspan = DEFAULT.dayspan;
    } else {
      dayspan = options.dayspan
    }

    if ((typeof options.conversation)==='undefined') {
      var conversation = DEFAULT.conversation;
    } else {
      conversation = options.conversation
    }

    /**
    *
    * validation options input
    *
    */
    if (limit%1 !== 0 || limit>500) throw Error('limit must be integer(<500) for GmailChannle! error: limit=' + limit );

    if (!(labels instanceof Array) || !(keywords instanceof Array)) throw Error('options.keywords or options.labels must be array for GmailChannel!')



    /////////////////////////////////////////////////////
    //
    // queryString start building. to filter out email

    // 1. query
    var queryString  = options.query || ''
    // 2. timespan
    if (dayspan!==null) queryString += ' ' + 'newer_than:' + dayspan + 'd'
    // 3. -doneLabel
    if (doneLabel!==null) queryString += ' ' + '-label:' + doneLabel
    // 4. keywords
    keywords.forEach(function (k) {
      if (!k) return

      var minusKeyword = /^-(.+)$/.exec(k)
      if (/"/.test(k)) { // 1. keyword里面有引号(")
        queryString += ' ' + k + ' '
      } else if (minusKeyword) { // 2. keyword前面有减号(-)
        queryString += ' ' + '-' + '"' + minusKeyword[1] + '" '
      } else { // 3. 其他
        queryString += ' ' +       '"' + k + '" '
      }
    })
    // 5. labels
    labels.forEach(function (l) {
      if (!l) return // tolearnt empty label

      var minusLabel = /^-(.+)$/.exec(l)
      if (minusLabel) {
        queryString += ' ' + '-label:' + minusLabel[1]
      } else {
        queryString += ' ' + 'label:' + l
      }
    })

    // queryString has been built.
    //
    ///////////////////////////////////////////////////////


    ///////////////////////////////////////////////////////
    //
    // UPPER_CASE varibles for quota in instance methods

    if (doneLabel) {
      var DONE_LABEL = GmailApp.getUserLabelByName(doneLabel)
      if (!DONE_LABEL) DONE_LABEL = GmailApp.createLabel(doneLabel)
    } else {
      DONE_LABEL = null
    }

    var NAME = name
    var LIMIT = limit
    var CONVERSATION = conversation
    var QUERY_STRING = queryString
    var RES = res
    var MIDDLEWARES = [] // functions work for use()

    var ERRORS = [] // store next(error) information

    // UPPER_CASE variables set
    //
    ///////////////////////////////////////////////////////

    /**
    * Instance of this
    */

    this.use = use
    this.done = done

    this.getName = getName
    this.getQueryString = function () { return QUERY_STRING }
    this.getMiddlewares = function () { return MIDDLEWARES }

    return this


    ////////////////////////////////////////////////////////
    //
    // Instance Methods

    function use(middleware) {

      /**
      *
      * 1. in case uf use([fn1, fn2, ...])
      *
      */
      if (middleware instanceof Array) {
        for (var i in middleware) {
          if (!(middleware[i] instanceof Function)) throw Error('use(middleware[' + i + ']) is not function!');
        }
        return middleware.map(function (m) { return use(m) })
      }

      /**
      *
      * 2. in case of use(fn1, fn2, ...)
      *
      */
      if (arguments.length>1) {
        for (var i in arguments) {
          if (!(arguments[i] instanceof Function)) throw Error('use(arguments[' + i + ']) is not function!');
        }
        return Array.prototype.map.call(arguments, function (m) { return use(m) })
      }

      /**
      *
      * 3. in case of use(fn)
      *
      */

      if (!(middleware instanceof Function)) throw Error('must use function for middleware! error[' + middleware + ']')

      MIDDLEWARES.push(middleware)

      return true
    }

    /**
    *
    * Run all middlewares for each thread, then call finallCallback(if specified)
    *
    * @param <Function> finalCallback
    *   finalCallback will be called at the end of all middleware had ran.
    *   because middleware could be terminated at the middle, the lastest one could not know what happend.
    *
    */
    function done(finalCallback) {

      if (finalCallback && (!finalCallback instanceof Function)) throw Error('done() need param finalCallback to be a function')

      var mailThreads = getNewThreads(LIMIT)

      var res, req

      // Count for how many times we called middlewares(threads/messages we had dealed with)
      var counter = 0

      for (var i=0; i<mailThreads.length; i++) {

        var mailMessages = mailThreads[i].getMessages()

        for (var j=0; j<mailMessages.length; j++) {
          /**
          *
          * re-init ERRORS & res & req
          *
          */
          ERRORS = []

          res = {}
          copyKeys(res, RES)

          req = {
            getChannelName: getName
            , getThread:  (function (t) { return function () { return t } })(mailThreads[i]) // closure for the furture possible run in nodejs, because of async call back
            , getMessage: (function (m) { return function () { return m } })(mailMessages[j])

            , getErrors: function ()  { return ERRORS }
            , pushError: function (e) { ERRORS.push(e) }
          }

          for (var k=0; k<MIDDLEWARES.length; k++) {

            var middleware = MIDDLEWARES[k]

            var isNextCalled = false
            var error = undefined

            try {
              middleware(req, res, function (err) {
                isNextCalled = true
                error = err
              })
            } catch (e) {
              error = e
            }

            if (error) ERRORS.push(error)

            if (!isNextCalled) {
              // loop end, because middleware did not call next
              break
            }

          } // END for loop of MIDDLEWARES

          if (finalCallback) finalCallback(req, res, function (err) { } )

          if (DONE_LABEL) mailThreads[i].addLabel(DONE_LABEL);

          counter++; // record we had run a set of middleware (procceed a mail message)

          /**
          *
          * if we are in conversation mode, we call middleware function chains for each thread.
          *
          */
          if (CONVERSATION) break;

        } // END for loop of mailMessages

      } // END for loop of mailThreads

      return counter
    }

    function getName() { return NAME }

    /**
    *
    * return arrary[]
    *
    */
    function getNewThreads(limit) {

      if (!limit) limit = 500 // 500 is the max number that gmail permit.
      if (!QUERY_STRING) return []

      // search for mails
      var threads = GmailApp.search(QUERY_STRING, 0, limit)

      return threads
    }
  }

  /**
  * Class GmailChannel
  */

  GmailChannel.getVersion = getVersion
  GmailChannel.copyKeys = copyKeys

  return GmailChannel


  ////////////////////////////////////////////////
  //                                           //
  // Class Static Methods                     //
  //                                         //
  ////////////////////////////////////////////

  function getVersion() {
    return VERSION
  }

  function copyKeys(destObj, srcObj) {
    for (var key in srcObj) {
      destObj[key] = srcObj[key]
    }
  }

}
