/* eslint-disable camelcase */
const LABELS = {
  BUSY        : 'Mike/BUSY',
  BizPlan     : 'BizPlan',
  BugBo       : 'Mike/BugBo',
  MikeBo      : 'Mike/MikeBo',
  NotBizPlan  : 'NotBizPlan',
  ToBeDeleted : 'ToBeDeleted',
}

class Mailer {

  static replySubmitGuideIfMailToBpAddress (req, res, next) {

    const messages: GoogleAppsScript.Gmail.GmailMessage[] = req.getThread().getMessages()

    const froms = messages
      .map(function (m) { return m.getFrom() })
      .join(',')

    const message = messages[0]
    const to = message.getTo()

    const RE = /bp@pre/i

    // 1. 不是发给  bp@pre... 的
    if (!RE.test(to))   return next('no guide sent coz not /^bp@pre/i') // 1. 不是发给  bp@pre... 的

    // 2. 用 bp@pre... 邮件地址作为发件人回复过。（如果  replySubmitGuide 过，就会有这样的发件人。这个if判断的目的是：不重复回复）
    if (RE.test(froms)) return next('submit guide had already sent before')

    // 3. 需要回复项目提交说明
    replySubmitGuide(message)
    return next('submit guide sent')
  }

  /**
  * Trash a bizplan thread.
  * do not keep bp in gmail
  * use a for loop is because: sometimes entrepreneur send their email more than one times.
  */
  static trashBizplan (req, res, next) {
    const messages = req.getThread().getMessages()
    let report = 'trashed message: '
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].getFrom() !== messages[0].getFrom()) break
      // then the following message(i) is as the same sender as the first one
      messages[i].moveToTrash()
      report += i + ', '
    }
    return next(report)
  }

  /*********************************************
   *
   *
   *
   */
  static forwardBizplan (req, res, next) {

    const messages = req.getThread().getMessages()

    /**
    *
    * 3. Forward BizPlan email to zixia-bp@googlegroups.com (if not do it before)
    *
    * 1. bp send to 'bp@...'had already been sent to zixia-bp@googlegroups.com, by gmail filter
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

  /**
   *
   * Do not touch mail from people I known
   *
   */
  static skipFromMyContacts (req, res, next) {
    let firstMessage = req.getThread().getMessages()[0]

    let from = firstMessage.getReplyTo() || firstMessage.getFrom()

    if (GasContact.isMyContact(from)) {
      return req.pushError('skipped my contact:' + from)
    }
    return next()
  }

  static skipFromInvalidSender (req, res, next) {
    let message = req.getMessage()
    let from = message.getReplyTo() || message.getFrom()

    let email = GasContact.getEmailName(from)

    if (!email) return req.pushError('skipped empty mail from:' + from)
    else        return next()
  }

  /**
   *
   * LABELS
   *
   */
  static labelAdd_Busy (req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName(LABELS.BUSY));        next() }
  static labelDel_Busy (req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName(LABELS.BUSY));        next() }

  static labelAdd_NotBizPlan (req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName(LABELS.NotBizPlan));  next() }
  static labelDel_NotBizPlan (req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName(LABELS.NotBizPlan));  next() }

  static labelAdd_Mike (req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName(LABELS.MikeBo));      next() }
  static labelDel_Mike (req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName(LABELS.MikeBo));      next() }

  static labelAdd_Bug (req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName(LABELS.BugBo));       next() }
  static labelDel_Bug (req, res, next) { req.getThread().removeLabel(GmailApp.getUserLabelByName(LABELS.BugBo));       next() }

  static labelAdd_BizPlan (req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName(LABELS.BizPlan));     next() }
  static labelAdd_ToBeDeleted (req, res, next) { req.getThread().addLabel(GmailApp.getUserLabelByName(LABELS.ToBeDeleted)); next() }

  /**
   *
   * Archive
   *
   */
  static moveToArchive (req, res, next) { req.getThread().moveToArchive(); next() }
  static trashMessage (req, res, next) { req.getMessage().moveToTrash(); next() }
  static markRead (req, res, next) { req.getThread().markRead(); next() }

  /**
   *
   * Utilities
   *
   */
  static isAllLabelsExist () {
    const ok = true
    try {
      Object.keys(LABELS).forEach(function (k) {
        const label = LABELS[k as keyof typeof LABELS]
        if (!GmailApp.getUserLabelByName(label)) throw new Error('label ' + label + ' not exist')
      })
    } catch (e) {
      ok = false
    }

    return ok
  }

}

//
// The Following are Helper Functions, not Middle Ware
//

/***
*
* Helper 2 - Reply BP
*
*/
function replySubmitGuide (message: GoogleAppsScript.Gmail.GmailMessage) {
  const from = message.getFrom()
  const name = GasContact.getEmailName(from)

  const t = HtmlService.createTemplateFromFile('templates/auto_reply')
  t.name = name
  const htmlReply = t.evaluate().getContent()

  const htmlBody = htmlReply + '<blockquote>' + message.getBody() + '</blockquote>'

  message.reply(htmlBody, {
    from: 'bp@pre-angel.com',
    htmlBody: htmlBody,
    name: 'Huan LI (李卓桓)',
  })
}

function forwardToZixiaBpGroup (message: GoogleAppsScript.Gmail.GmailMessage) {
  /*
  * Get size(in bytes) of all attachments
  */
  let totalSize = 0
  const attachments = message.getAttachments()
  for (var i = 0; i < attachments.length; i++) {
    totalSize += message.getAttachments()[i].getSize()
  }
  var eightMegaByte = 8 * 1024 * 1024

  if (totalSize > eightMegaByte) {
    log(log.INFO, 'attachment size: %s, > 8MB(%s), skip forward.', totalSize, eightMegaByte)
    return null
  }

  const ZIXIA_BP_GROUP = 'zixia-bp@googlegroups.com'

  message.forward(ZIXIA_BP_GROUP, {
    from: 'zixia@zixia.net',
  })

  let fwdMessage: GoogleAppsScript.Gmail.GmailMessage

  let ttl = 7
  while (ttl-- > 0) {
    /**
    *
    * GmailApp.refreshThread(thread)
    * not work!??? (20160122 failed again)
    *
    * must use GmailApp getThread, to force reload
    *
    */
    const threadId = message.getThread().getId()
    const thread = GmailApp.getThreadById(threadId)

    log(log.DEBUG, 'forward ttl:%s, message num:%s', ttl, thread.getMessages().length)

    const isNotTrash = (m: GoogleAppsScript.Gmail.GmailMessage) => !m.isInTrash()
    const isFromZixia = (m: GoogleAppsScript.Gmail.GmailMessage) => m.getFrom() === 'zixia@zixia.net'
    const isToBpGroup = (m: GoogleAppsScript.Gmail.GmailMessage) => m.getTo() === ZIXIA_BP_GROUP

    const messages = thread.getMessages()
      .filter(isNotTrash)
      .filter(isFromZixia)
      .filter(isToBpGroup)

    if (messages.length > 0) {
      fwdMessage = messages[0]
      break
    }
    Utilities.sleep(1000)
  }

  if (ttl <= 0) {
    throw Error('forwarded email ttl timeout.')
  }

  // FIXME(huan) fwdMessage might not initialized
  return fwdMessage!
}

export { Mailer }
