function MailBot() {
  'use strict'

  // DAYSPAN: how many day(s) looks back by search
  var DAYSPAN = 7
  // LIMIT: how many message(s) processed by run once
  var LIMIT   = 7

  if ((typeof log)==='undefined') eval ('var log = new GasLog()')

  GmailApp.getAliases() // Require permission
  const GmailChannel = getGmailChannel()

  log(log.DEBUG, 'InboxCleaner starting...')


  ////////////////////////////////////////////////////
  //
  // Development & Testing
  //
//  return development()
//  return doZixiaChannel()
  //
  ////////////////////////////////////////////////////


  /////////////////////////////////////////////////////////////////////
  //
  // Start Cleaning

  var numProcceed = 0

  var tasks = [
    doBulkChannel           // 0. 群发邮件，并且不是发到我的邮箱的

    , doBpWithCipherChannel // 1. 只发到 bp@pre 邮箱的，但是有我的名字
    , doBpZixiaChannel      // 2. 同时发给 zixia@pre 和  bp@pre 邮箱
    , doZixiaChannel        // 3. 只发到 zixia@pre 邮箱

    , doFormChannel         // 4. 通过表单提交(JsForm)
    , doApplyChannel        // 5. PreAngel申请表(MikeCRM)
    , doIntviuChannel       // 6. 橙云面试视频(IntViu)

    , doPlugAndPlayChannel  // 7. Plug and Play BP
    , doReviewChannel       // 8. PA项目评估
  ]

  /**
  * Shuffle an array
  * http://stackoverflow.com/a/25984542/1123955
  * http://jsperf.com/fyshuffle
  */
  function fy(a, b, c, d) { c=a.length;while(c)b=Math.random()*(--c+1)|0,d=a[c],a[c]=a[b],a[b]=d }
  fy(tasks)

  for (var i=0; i<tasks.length; i++) {
    numProcceed += tasks[i]()

//    Logger.log(tasks[i].name)

    if (Gas.isYourTime()) {
      log(log.DEBUG, 'MailBot breaked after procceed %s mails, runned %s seconds', numProcceed, Gas.getLifeSeconds())
      break
    }
  }

  // End Cleaning
  //
  /////////////////////////////////////////////////////////////////////

  if (numProcceed) log(log.DEBUG, 'MailBot procceed %s mails, runned %s seconds', numProcceed, Gas.getLifeSeconds())


  return numProcceed








  //////////////////////////////////////////////////////////////////////////
  //
  // END: Main code above execute END here
  //
  //////////////////////////////////////////////////////////////////////////




  /******************************************************
  *
  *
  *
  * 0. Clean bulk emails of inbox
  *
  *
  *
  */
  function doBulkChannel() {

    var whiteFromList = [
      'plugandplaychina.com',
      'plugandplaytechcenter.com',
      'plugandplaytc.com',
      'pnptc.com',
      'pnp.vc',

      'jsform.com',

      'microsoft.com',
      'google.com',

      'tsinghua.org',
      'teec.org.cn',
    ]

    var whiteToList = [
      'mstechdiscussions.com',
      'tensorflow.org',
      'w3c.org',
      'w3.org',
      'pnp.vc', // PNP 有自己独立的Channel
      'pnptc.com',
      'ml-gde@googlegroups.com',
      'apache.org',
      'kaiyuanshe.org',
    ]

    var bulkChannel = new GmailChannel ({
      name: 'bulk'
      , keywords: []
      , labels: [
        'inbox'
        , 'unread'
        , '-' + 'ToBeDeleted'
        , '-' + 'trash'
      ]
      , dayspan: DAYSPAN
      , query: ['-(zixia OR huan '
                , ' OR lizh OR lizhuohuan OR lzhuohuan OR zhuohuan '
                , ' OR 卓桓 OR 李兄 OR 李卓桓 OR 卓恒 OR 李卓恒 OR 李总 OR 李老师 OR 李先生 '
                , ' OR abu OR 阿布 OR bruce OR ceibsmobi.com OR akamobi.com OR chatie.io'
                , ')'

                , '-is:important'
                , '-17salsa'
                , '-融资申请'
                , '-最简单的创业计划书'
                , '-PreAngel创始人申请表'
               ].join(' ')
      + ' -from:(' + whiteFromList.join(' OR ') + ')'
      + ' -to:(' + whiteToList.join(' OR ') + ')'

      , doneLabel: 'OutOfBulkChannel'
      , limit: LIMIT
      , res: {}
    })

    bulkChannel.use(
      Tracker.logOnStart

      , Tracker.logOnTime                         // measure performance

      , Mailer.skipFromInvalidSender              // 1s
      , Mailer.skipFromMyContacts                 // 1s

      , Tracker.logOnTime                         // measure performance
      , Mailer.replySubmitGuideIfMailToBpAddress

      , Tracker.logOnTime                         // measure performance
      , Mailer.labelAdd_ToBeDeleted
      , Mailer.moveToArchive

      , Tracker.logOnTime                         // measure performance
      , Bizplaner.init                            // ?

      , Bizplaner.skipInvalidBizplan
      , Mailer.labelAdd_BizPlan

      , Tracker.logOnTime                         // measure performance
      , Tracker.logOnTime                         // measure performance
      , Ticketor.tryToPair
      , Tracker.logOnTime                         // measure performance
      , Ticketor.noteOrCreate
      , Tracker.logOnTime                         // measure performance
      , Ticketor.closeIfNew
      , Tracker.logOnTime                         // measure performance

      , Bizplaner.cinderella
      , Ticketor.noteCinderella
      , Tracker.logOnTime                         // measure performance
    )

    return bulkChannel.done(Tracker.logOnEnd)

  }













  /******************************************************
  *
  *
  *
  * 1. to:bp@pre-angel.com with CIPHER for zixia
  *
  *
  *
  */
  function doBpWithCipherChannel() {

    // 1. to:bp with CIPHER
    var bpWithCipherChannel = new GmailChannel({
      name: 'bpWithCipher'
      , keywords: []
      , labels: [ 'inbox', '-trash' ]
      , dayspan: DAYSPAN
      , query: ['(to:(bp@pre-angel.com OR bp@preangelpartners.com) NOT to:zixia)'
                , '(abu OR 阿布 OR bruce OR zixia OR huan OR lizh OR lizhuohuan OR zhuohuan OR 卓桓 OR 李兄 OR 李卓桓 OR 卓恒 OR 李卓恒 OR 李总 OR 李老师 OR 李先生)'
                , '("邮箱发来的超大附件" OR "邮箱发来的云附件" OR (filename:pptx OR filename:ppt OR filename:pdf OR filename:doc))'
               ].join(' ')
      , doneLabel: 'OutOfBpCipherChannel'
      , limit: LIMIT
      , res: {}
    })

    bpWithCipherChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_NotBizPlan

      , Bizplaner.init

      , Mailer.skipFromInvalidSender
      , Mailer.skipFromMyContacts
      , Bizplaner.skipInvalidBizplan

      , Mailer.labelDel_NotBizPlan
      , Mailer.labelAdd_BizPlan


      , Ticketor.create
      , Ticketor.process
      , Mailer.trashBizplan

      , Bizplaner.cinderella
      , Ticketor.noteCinderella
    )

    return bpWithCipherChannel.done(Tracker.logOnEnd)

  }









  /***************************************************
  *
  *
  *
  * 2. to:(huan@pre-angel.com OR bp@pre-angel.com)
  *
  *
  *
  */
  function doBpZixiaChannel() {

    // 2. to:bp AND to:zixia
    var bpZixiaChannel = new GmailChannel({
      name: 'bpZixia'
      , keywords: []
      , labels: [ 'inbox', '-trash' ]
      , dayspan: DAYSPAN
      , query: [ 'to:(huan@pre-angel.com OR zixia@pre-angel.com OR zixia@preangelpartners.com)'
                , 'to:(bp@pre-angel.com OR bp@preangelpartners.com)'
                , '(has:attachment OR "邮箱发来的超大附件" OR "邮箱发来的云附件")'
               ].join(' ')
      , doneLabel: 'OutOfBpZixiaChannel'
      , limit: LIMIT
      , res: {}
    })

    bpZixiaChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_NotBizPlan

      , Bizplaner.init

      , Mailer.skipFromInvalidSender
      , Mailer.skipFromMyContacts
      , Bizplaner.skipInvalidBizplan

      , Mailer.labelDel_NotBizPlan
      , Mailer.labelAdd_BizPlan


      , Ticketor.create
      , Ticketor.process
      , Mailer.trashBizplan

      , Bizplaner.cinderella
      , Ticketor.noteCinderella
    )

    return bpZixiaChannel.done(Tracker.logOnEnd)

  }










  /******************************************************
  *
  *
  *
  * 3. to:huan@pre-angel.com (ONLY. NOT to:bp@pre-angel.com)
  *
  *
  *
  */
  function doZixiaChannel() {

    var zixiaChannel = new GmailChannel({
      name: 'zixia'
      , keywords: []
      , labels: [ 'inbox', '-trash' ]
      , dayspan: DAYSPAN
      , query: [ '("邮箱发来的超大附件" OR "邮箱发来的云附件" OR (filename:pptx OR filename:ppt OR filename:pdf))'
                , '(to:(huan@pre-angel.com OR zixia@pre-angel.com OR zixia@preangelpartners.com OR zixia@preangelfund.com) NOT to:(bp@pre-angel.com OR bp@preangelpartners.com))'
               ].join(' ')
      , doneLabel: 'OutOfZixiaChannel'
      , limit: LIMIT
      , res: {}
    })

    zixiaChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_NotBizPlan

      , Bizplaner.init

      , Mailer.skipFromInvalidSender
      , Mailer.skipFromMyContacts
      , Bizplaner.skipInvalidBizplan

      , Mailer.labelDel_NotBizPlan
      , Mailer.labelAdd_BizPlan

      , Ticketor.create
      , Ticketor.process
      , Mailer.forwardBizplan
      , Mailer.trashBizplan
    )

    return zixiaChannel.done(Tracker.logOnEnd)

  }










  /******************************************************
  *
  *
  *
  * 4. Submit from form
  *
  *
  *
  */
  function doFormChannel() {

    var formChannel = new GmailChannel({
      name: 'form'
      , keywords: [
        '融资申请'
        , '最简单的创业计划书'
        , '-abcdefghijklmnopqrstuvwxyz'
      ]
      , labels: ['-trash']
      , dayspan: DAYSPAN
      , query: 'to:bp'
      , doneLabel: 'OutOfFormChannel'
      , limit: LIMIT
      , res: {}
    })

    formChannel.use(
      Tracker.logOnStart

      , Mailer.labelAdd_BizPlan

      , Bizplaner.init
      , Parser.jsform

      , Ticketor.tryToPair
      , Ticketor.noteOrCreate

      , Bizplaner.analyzeDetails
      , Ticketor.process

      , Mailer.labelAdd_ToBeDeleted
      , Mailer.moveToArchive
    )

    return formChannel.done(Tracker.logOnEnd)

  }










  /******************************************************
  *
  *
  *
  * 5. Submit from MikeCRM
  *
  *
  *
  */
  function doApplyChannel() {

    var applyChannel = new GmailChannel({
      name: 'apply'
      , keywords: [ 'PreAngel创始人申请表' ]
      , labels: [ '-trash' ]
      , dayspan: DAYSPAN
      , query: 'from:mikecrm.com to:(zixia OR bp)'
      , doneLabel: 'OutOfApplyChannel'
      , limit: LIMIT
      , res: {}
    })

    log(log.DEBUG, applyChannel.getName() + ' QUERY_STRING: [' + applyChannel.getQueryString() + ']')

    applyChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_BizPlan

      , Bizplaner.init
      , Parser.mikecrm

      , Ticketor.tryToPair
      , Ticketor.replyOrCreate
      , Ticketor.mediumPriority

      , Mailer.markRead
      , Mailer.moveToArchive
    )

    return applyChannel.done(Tracker.logOnEnd)

  }











  /******************************************************
  *
  *
  *
  * 6. Intviu Interview
  *
  *
  *
  */
  function doIntviuChannel() {

    var intviuChannel = new GmailChannel({
      name: 'intviu'
      , keywords: [ '您发布的职位已有面试视频上传' ]
      , labels: [ '-trash' ]
      , dayspan: DAYSPAN
      , query: 'from:@intviu.cn to:(zixia OR bp)'

      /**
      * Don't exclude thread out of channel after process.
      * instead, we trash each message after process.
      * because maybe there'll be new message arrived in this thread when we are processing.
      */
      , doneLabel: null
      , conversation: false

      , limit: LIMIT
      , res: {}
    })

    intviuChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_BizPlan

      , Bizplaner.init
      , Parser.intviu

      , Ticketor.tryToPair
      , Ticketor.replyOrCreate
      , Ticketor.highPriority

      , Mailer.trashMessage
    )

    return intviuChannel.done(Tracker.logOnEnd)

  }

  /**
   *
   * 7. Plug and Play Channel
   *
   */
  function doPlugAndPlayChannel() {
    var pnpChannel = new GmailChannel({
      name: 'PnP'
      , labels: [ 'inbox', '-trash' ]
      , dayspan: DAYSPAN
      , query: 'to:bp@pnp.vc (NOT to:zixia)'

      , doneLabel: 'OutOfPnPChannel'

      , limit: LIMIT
      , res: {}
    })

    pnpChannel.use(
      Tracker.logOnStart
      , Mailer.labelAdd_BizPlan

      , Bizplaner.init

      , Ticketor.tryToPair
      , Ticketor.noteOrCreate
      , Ticketor.groupPnp
//      , Ticketor.assignChen

      , Mailer.labelAdd_ToBeDeleted
      , Mailer.moveToArchive
    )

    return pnpChannel.done(Tracker.logOnEnd)

  }

  /******************************************************
  *
  *
  *
  * 8. PA项目评估（JsForm）
  *
  *
  *
  */
  function doReviewChannel() {

    var reviewChannel = new GmailChannel({
      name: 'review'
      , keywords: [
        'PreAngel项目评估表'
      ]
      , labels: ['inbox', '-trash']
      , dayspan: DAYSPAN
      , query: 'to:bp AND from:表单大师'
      , doneLabel: 'OutOfReviewChannel'
      , limit: LIMIT
      , res: {}
    })

    Logger.log(reviewChannel.getQueryString())

    reviewChannel.use(
      Tracker.logOnStart

      , Mailer.labelAdd_BizPlan

      , Bizplaner.init
      , Parser.review

      , Ticketor.tryToPair
      , Ticketor.noteOrCreate
      , Ticketor.groupFollow
      , Ticketor.closeIfNew

      , Mailer.labelAdd_ToBeDeleted
      , Mailer.moveToArchive
    )

    return reviewChannel.done(Tracker.logOnEnd)

  }
}
