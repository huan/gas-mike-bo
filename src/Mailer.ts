var Mailer = (function () {
  'use strict'
  
  var VERSION = '0.1.0'
  
  var LABELS = {
    BizPlan:       'BizPlan'
    , NotBizPlan:  'NotBizPlan'
    , MikeBo:      'Mike/MikeBo'
    , BugBo:       'Mike/BugBo'
    , ToBeDeleted: 'ToBeDeleted'
    
    , BUSY:        'Mike/BUSY'
  }
  

  return {
    
    
    replySubmitGuideIfMailToBpAddress: replySubmitGuideIfMailToBpAddress

    , trashBizplan:          trashBizplan
    , forwardBizplan:        forwardBizplan

    , skipFromMyContacts:    skipFromMyContacts
    , skipFromInvalidSender: skipFromInvalidSender

    
    /**
    *
    * LABELS
    *
    */
    , labelAdd_Busy:        function (req, res, next) { req.getThread().addLabel   (GmailApp.getUserLabelByName(LABELS.BUSY));        next() }
    , labelDel_Busy:        function (req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName(LABELS.BUSY));        next() }
    
    , labelAdd_NotBizPlan:  function (req, res, next) { req.getThread().addLabel   (GmailApp.getUserLabelByName(LABELS.NotBizPlan));  next() }
    , labelDel_NotBizPlan:  function (req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName(LABELS.NotBizPlan));  next() }
    
    , labelAdd_Mike:        function (req, res, next) { req.getThread().addLabel   (GmailApp.getUserLabelByName(LABELS.MikeBo));      next() }
    , labelDel_Mike:        function (req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName(LABELS.MikeBo));      next() }
    
    , labelAdd_Bug:         function (req, res, next) { req.getThread().addLabel   (GmailApp.getUserLabelByName(LABELS.BugBo));       next() }
    , labelDel_Bug:         function (req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName(LABELS.BugBo));       next() }
    
    , labelAdd_BizPlan:     function (req, res, next) { req.getThread().addLabel   (GmailApp.getUserLabelByName(LABELS.BizPlan));     next() }
    , labelAdd_ToBeDeleted: function (req, res, next) { req.getThread().addLabel   (GmailApp.getUserLabelByName(LABELS.ToBeDeleted)); next() }
  
    /**
    *
    * Archive
    *
    */
    , moveToArchive: function (req, res, next) { req.getThread().moveToArchive(); next() }
    , trashMessage:  function (req, res, next) { req.getMessage().moveToTrash(); next() }
    , markRead:      function (req, res, next) { req.getThread().markRead(); next() }
    
    /**
    *
    * Utilities
    *
    */
    , isAllLabelsExist: isAllLabelsExist
  }

  //
  // All Done.
  //
  ////////////////////////////////////////////////////////////////////////////////
  
  
  

 


  /**
  * Trash a bizplan thread.
  * do not keep bp in gmail
  * use a for loop is because: sometimes entrepreneur send their email more than one times.
  */
  function trashBizplan(req, res, next) {
    var messages = req.getThread().getMessages()
    var report = 'trashed message: '
    for (var i=0; i<messages.length; i++) {
      if (messages[i].getFrom() != messages[0].getFrom()) break
      // then the following message(i) is as the same sender as the first one
      messages[i].moveToTrash()
      report += i + ', '
    }
    return next(report)
  }

  /**
  *
  * Do not touch mail from people I known
  *
  */
  function skipFromMyContacts(req, res, next) {
    var firstMessage = req.getThread().getMessages()[0]
    
    var from = firstMessage.getReplyTo() || firstMessage.getFrom()
    
    if (GasContact.isMyContact(from)) {
      return req.pushError('skipped my contact:' + from)
    } 
    return next()
  }
  
  function skipFromInvalidSender(req, res, next) {
    var message = req.getMessage()
    var from = message.getReplyTo() || message.getFrom()
    
    var email = GasContact.getEmailName(from)
    
    if (!email) return req.pushError('skipped empty mail from:' + from)
    else        return next()
  }
  
  function replySubmitGuideIfMailToBpAddress(req, res, next) {
    
    var messages = req.getThread().getMessages() 
    
    var froms = messages
    .map(function (m) { return m.getFrom() })
    .join(',')
    
    var message = messages[0]
    var to = message.getTo()   
    
    var RE = /bp@pre/i
    
    // 1. 不是发给  bp@pre... 的
    if (!RE.test(to))   return next('no guide sent coz not /^bp@pre/i') // 1. 不是发给  bp@pre... 的

    // 2. 用 bp@pre... 邮件地址作为发件人回复过。（如果  replySubmitGuide 过，就会有这样的发件人。这个if判断的目的是：不重复回复）
    if (RE.test(froms)) return next('submit guide had already sent before') 
    
    // 3. 需要回复项目提交说明
    replySubmitGuide(message)
    return next('submit guide sent')
  }
  
  /*********************************************
  *
  *
  *
  */
  function forwardBizplan(req, res, next) {
    
    var messages = req.getThread().getMessages()
    
    /**
    *
    * 3. Forward BizPlan email to zixia-bp@googlegroups.com (if not do it before)
    *
    * 1. bp send to 'bp@...'had alread been sent to zixia-bp@googlegroups.com, by gmail filter
    * 2. bp not sent to 'bp@xxx' should be forward here.
    *
    */
    if (!/bp@/.test(messages[0].getTo() + ',' + messages[0].getCc())) {
      try {
        var forwardMessage = forwardToZixiaBpGroup(messages[0])
        if (forwardMessage) {
          req.pushError('forwarded')
          forwardMessage.moveToTrash()
        }
      } catch (e) {
        req.pushError('forward failed: ' + e.name + ', ' + e.message)
      }
    }
    
    return next()
  }

  
  
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  //
  // The Following are Helper Functions, not Middle Ware
  //
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  
  
  
  /***
  *
  * Helper 2 - Reply BP
  *
  */
  function replySubmitGuide(message) {  
    var from = message.getFrom()
    var name = GasContact.getEmailName(from)
    
    var t = HtmlService.createTemplateFromFile('AutoReply')
    t.name = name
    var htmlReply = t.evaluate().getContent()
    
    var htmlBody = htmlReply + '<blockquote>' + message.getBody() + '</blockquote>'
    
    message.reply(null, {
      from: 'bp@pre-angel.com'
      , name: 'Huan LI (李卓桓)'
      , htmlBody: htmlBody
    })
  }  


  function forwardToZixiaBpGroup(message) {
    /*
    * Get size(in bytes) of all attachments
    */
    var totalSize = 0
    var attachments = message.getAttachments()
    for (var i = 0; i < attachments.length; i++) {
      totalSize += message.getAttachments()[i].getSize()
    }
    var eightMegaByte = 8 * 1024 * 1024
    
    if (totalSize > eightMegaByte) {
      log(log.INFO, 'attachment size: %s, > 8MB(%s), skip forward.', totalSize, eightMegaByte)
      return null
    }
    
    var ZIXIABPGROUP = 'zixia-bp@googlegroups.com'
    
    message.forward(ZIXIABPGROUP, {
      from: 'zixia@zixia.net'
    })
    
    var fwdMessage
    
    var ttl = 7
    while (ttl-- > 0) {
      /**
      * 
      * GmailApp.refreshThread(thread)
      * not work!??? (20160122 failed again)
      *
      * must use GmailApp getThread, to force reload
      *
      */
      var threadId = message.getThread().getId()
      var thread = GmailApp.getThreadById(threadId)
      
      log(log.DEBUG, 'forward ttl:%s, message num:%s', ttl, thread.getMessages().length)
      
      var messages = thread.getMessages()
      .filter(function(m) {
        var isFwd = !m.isInTrash() && 'zixia@zixia.net' == m.getFrom() && ZIXIABPGROUP == m.getTo()
        return isFwd
      })
      
      if (messages.length > 0) {
        fwdMessage = messages[0]
        break
      }
      Utilities.sleep(1000)
    }
    
    if (ttl <= 0) {
      throw Error('forwarded email ttl timeout.')
    }
    
    return fwdMessage
  }

  function isAllLabelsExist() {
    var ok = true
    try {
      Object.keys(LABELS).forEach(function (k) {
        var label = LABELS[k]
        if (!GmailApp.getUserLabelByName(label)) throw new Error('label ' + label + ' not exist')
      })
    } catch (e) {
      ok = false
    }
    
    return ok
  } 

}())

function testMailer() {
  Logger.log(Mailer.isAllLabelsExist())
}