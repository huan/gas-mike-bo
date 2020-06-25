var Ticketor = (function () {
  'use strict'

  var VERSION = '0.1.0'

  /**
  *
  * 3. Freshdesk API
  *
  */
  // if ((typeof GasFreshdesk)==='undefined') { // GasFreshdesk Initialization. (only if not initialized yet.)
  //   var TTL = 3
  //   var CODE = undefined
  //   while (!CODE && TTL-->0) {
  //     try {
  //       CODE = UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gas-freshdesk/master/src/gas-freshdesk-lib.js').getContentText()
  //     } catch (e) {
  //       log(log.ERR, 'UrlFetchApp.fetch freshdesk lib exception(ttl:%s): %s', TTL, e.message)
  //       Utilities.sleep(1000)
  //     }
  //   }
  //   if (CODE) {
  //     eval(CODE)
  //   }
  // } // Class Freshdesk is ready for use now!
  const GasFreshdesk = getGasFreshdesk()

  var FRESHDESK_URL = PropertiesService.getScriptProperties().getProperty('FreshdeskDomainUrl')
  var FRESHDESK_KEY = PropertiesService.getScriptProperties().getProperty('FreshdeskApiKey')

  var MyFreshdesk = new GasFreshdesk(FRESHDESK_URL, FRESHDESK_KEY)
  var Ticket = MyFreshdesk.Ticket
  var Contact = MyFreshdesk.Contact
  var Agent = MyFreshdesk.Agent

  // hardcoded for cache
  var ID_AGENT_MARY = 5008844005
  var ID_AGENT_ZIXIA = 5006515033
//  var ID_AGENT_ZIXIA = Agent.list({ email: 'zixia@zixia.net' })[0].getId()
//  var ID_AGENT_MARY  = Agent.list({ email: 'mary@aka.cn'     })[0].getId()
//  var ID_AGENT_CHEN  = Agent.list({ email: 'chen@plugandplaytechcenter.com' })[0].getId()

  var ID_GROUP_PNP    = 5000254541
  var ID_GROUP_FOLLOW = 5000238074

  var Ticketor = function () {
  }

  Ticketor.create     = create
  Ticketor.process    = process
  Ticketor.close      = function (req, res, next) { req.ticket.close(); next() }
  Ticketor.closeIfNew = function (req, res, next) { if(req.ticket && req.ticket.isNew) req.ticket.close(); next() }

  Ticketor.tryToPair = tryToPair
  Ticketor.noteOrCreate = noteOrCreate
  Ticketor.replyOrCreate = replyOrCreate

  Ticketor.mediumPriority = function (req, res, next) { req.ticket.mediumPriority(); next() }
  Ticketor.highPriority = function (req, res, next) { req.ticket.highPriority(); next() }

  Ticketor.assignMary = function (req, res, next) { req.ticket.assign(ID_AGENT_MARY); next() }
//  Ticketor.assignChen = function (req, res, next) { req.ticket.assign(ID_AGENT_CHEN); next() }

  Ticketor.groupPnp    = function (req, res, next) { req.ticket.setGroup(ID_GROUP_PNP); next() }
  Ticketor.groupFollow = function (req, res, next) { req.ticket.setGroup(ID_GROUP_FOLLOW); next() }

  Ticketor.noteCinderella = noteCinderella

  return Ticketor

  ///////////////////////////////////////////////////////////

  function noteCinderella(req, res, next) {
    var ticket = req.ticket
    var cinderella = req.cinderella

    if (ticket && cinderella) {
      ticket.note({
//        body_html: JSON.stringify(cinderella)
        body: 'Cinderella: ' + JSON.stringify(cinderella, null, ' ')
        , private: true
      })
      req.pushError('cinderella reported to ticket#' + ticket.getId())
    }

    return next()
  }


  function tryToPair(req, res, next) {
    var email = req.bizplan.getFromEmail()

    if (email) var contacts = Contact.list({ email: email })

    if (contacts && contacts.length) {
      var contactId = contacts[0].getId()
      if (contactId) var tickets = Ticket.list({ requester_id: contactId })
      if (tickets && tickets.length) req.ticket = tickets[0]
    }

    var ticketId = req.ticket ? req.ticket.getId() : '?'

    return next('paired ticket#' + ticketId )
  }

  /**
  *
  *
  *
  */
  function noteOrCreate(req, res, next) {
    var ticket  = req.ticket
    var bizplan = req.bizplan

    var description = bizplan.getBody()

    // 1. existing ticket
    if (ticket) {
      ticket.open()

      var noteObj = {
        body: getHtmlTo(bizplan) + bizplan.getBody()
        , private: true
      }
      var attachments = bizplan.getAttachments()
      if (attachments && attachments.length) noteObj.attachments = attachments

      ticket.note(noteObj)
      return next('added note to ticket#' + ticket.getId())
    }

    // 2. new ticket
    return create(req, res, next)
  }

  /**
  *
  *
  *
  */
  function replyOrCreate(req, res, next) {
    var ticket  = req.ticket
    var bizplan = req.bizplan

    // 1. existing ticket
    if (ticket) {
      ticket.open()

      var replyObj = {
        body: getHtmlTo(bizplan) + bizplan.getBody()
      }
      var attachments = bizplan.getAttachments()
      if (attachments && attachments.length) replyObj.attachments = attachments

      ticket.reply(replyObj)

      return next('replied ticket#' + ticket.getId())
    }

    // 2. create new ticket
    return create(req, res, next)
  }

  function process(req, res, next) {

    var analyze = req.analyze
    var ticket = req.ticket

    var shouldClose = false
    var noteMsg = ''

    if (analyze) {

      if(analyze.zixia) { // is to zixia, known it from formChannel
        if (!analyze.beijing) {
          noteMsg = '非北京'
          //        ticket.close()
        } else if (analyze.game) {
          noteMsg = '游戏'
          //        ticket.close()
        } else if (analyze.offline) {
          noteMsg =  '电商/O2On'
          //        ticket.close()
        } else {
          noteMsg = '内容分析结果未知'
        }

        noteMsg += '，是投递给zixia的'
        ticket.mediumPriority()
        ticket.assign(ID_AGENT_MARY)

      } else {
        noteMsg = '不碰指定发给他人的BP'
        shouldClose = true
        if (req.startup && req.startup.deliverTo) {
          noteMsg = noteMsg.concat('(', req.startup.deliverTo, ')')
        }
      }

    } else { // no analyze
      noteMsg = '未能进行分析'
      ticket.lowPriority()
      ticket.assign(ID_AGENT_MARY)
    }

    ticket.note({
      body: noteMsg
      , private: true
    })

    if (shouldClose) ticket.close()

    return next(noteMsg)
  }


  /*********************************************
  *
  * create freshdesk ticket!
  *
  */
  function create(req, res, next) {
    var bizplan = req.bizplan

    /**
    *
    * make payload for api
    *
    */
    var ticketObj = {
      description: getHtmlTo(bizplan) + bizplan.getBody()
      , subject: bizplan.getSubject()
      , name:    bizplan.getFromName()
      , email:   bizplan.getFromEmail()
    }

    var attachments = bizplan.getAttachments()
    if (attachments && attachments.length) ticketObj.attachments = attachments

    req.ticket = new Ticket(ticketObj)
    req.ticket.isNew = true

    return next('created ticket #' + req.ticket.getId())
  }


  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  //
  // The Following are Helper functions, not Middle Ware.
  //
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////

  /**
  *
  * log all recipients in the email body
  *
  */
  function getHtmlTo(bizplan) {
    var htmlTo = bizplan.getTo()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

    var htmlCc = bizplan.getCc()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

    return ['<p>To: '
            , htmlTo
            , '</p><br />'

            , '<p>Cc: '
            , htmlCc
            , '</p><br />'
           ].join()
  }

}())
