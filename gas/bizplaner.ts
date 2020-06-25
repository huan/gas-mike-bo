import { Bizplan } from './bizplan'
import { GasContact } from './gas-contacts'

class Bizplaner {

  static init (req, res, next) {
    // the current email from entrepreneur, normally is BP
    var message = req.getMessage()

    req.bizplan = new Bizplan(message)
    return next()
  }

  static skipInvalidBizplan (req, res, next) {
    log(log.DEBUG, 'entered skipInvalidBizplan')

    var messages = req.getThread().getMessages()

    /**
    *
    * 1. Should has no trash message (fresh: had never been touched)
    * 2. Should has no other people reply (fresh: only sender self)
    * 3. Should has attachment
    *
    */
    var from = messages[0].getFrom()

    /**
    * Check all the messages in thread(also include trashed ones)
    */
    for (var i = 0; i < messages.length; i++) {

      if (/@google.com/.test(messages[i].getFrom())) continue

      // 1. check trashed message
      // duplicated check with step 2.
      // if (messages[i].isInTrash() && messages[i].getFrom() !== messages[0].getFrom()) {
      //   isNotBizPlan = true
      //   req.pushError('someone have touched this thread')
      // }

      // 2. check if other people had replied
      if (messages[i].getFrom() !== from) return req.pushError('not all message sent from one sender')
    }

    if (!hasAttachment(req.bizplan)) return req.pushError('has no attachment')

    next()
  }

  static analyzeDetails (req, res, next) {
    var bizplan = req.bizplan

    if (!bizplan) throw Error('no bizplan found, cant analyze')

    req.analyze = {
      beijing : isBeijing(bizplan),
      game    : isGame(bizplan),
      offline : isOffline(bizplan),
      zixia   : isToZixia(bizplan),
    }

    return next()
  }

  static cinderella (req, res, next) {
    var bizplan = req.bizplan

    req.cinderella = Cinderella.query({
      attachments : bizplan.getAttachments(),
      body        : bizplan.getBody(),
      from        : bizplan.getFromEmail(),
      subject     : bizplan.getSubject(),
      to          : bizplan.getTo(),
    })

    return next('cinderella-ed')
  }

}

//
// The Following are Helper functions, not Middle Ware.
//


function isBeijing(bizplan) {
  var testStr = bizplan.getLocation() + ',' + bizplan.getCompany()

  var isBeijing = false
  if (/北京|beijing|中关村|海淀/i.test(testStr)) isBeijing = true

  var mobile = bizplan.getFounderMobile()
  if (GasContact.isBeijingMobile(mobile)) {
    isBeijing = true
  }

  return isBeijing
}

function isGame (bizplan) {
  var str = [
    bizplan.getSubject(),
    bizplan.getBody(),
    bizplan.getProblem(),
    bizplan.getSolution(),
  ].join(',')

  var isGame = false
  if (/游戏/.test(str)) {
    isGame = true
  }

  return isGame
}

function isOffline (bizplan) {
  var str = [
    bizplan.getSubject(),
    bizplan.getBody(),
    bizplan.getProblem(),
    bizplan.getSolution(),
  ].join(',')

  var isOffline = false
  if (/电商|O2O/i.test(str)) {
    isOffline = true
  }

  return isOffline
}

function isToZixia (bizplan) {
  var zixiaCiphers = [
    'abu',
    '阿布',
    'bruce',
    'zixia',
    'lizh',
    'lizhuohuan',
    'zhuohuan',
    '卓桓',
    '李兄',
    '李卓桓',
    '卓恒',
    '李卓恒',
    '李总',
    '李老师',
    '李先生',
    'PABP',
    'MIKEBO',
  ]
  var zixiaCiphersRe = new RegExp(zixiaCiphers.join('|'), 'i')

  var testStr = [
    bizplan.getSubject(),
    bizplan.getTo(),
    bizplan.getBody(),
  ].join(',')

  var isToZixia = false

  if (zixiaCiphersRe.test(testStr)) isToZixia = true

  var destination = bizplan.getDestination()

  if (destination) {
    if (/无所谓|所有人/.test(destination)) isToZixia = true
    else if (!/李卓桓/.test(destination)) isToZixia = false
  }

  return isToZixia
}

function hasAttachment (bizplan) {
  if (!bizplan)                        return false
  if (bizplan.getAttachments().length) return true

  var cloudWords = [
    '邮箱发来的超大附件',
    '邮箱发来的云附件',
  ]

  var RE = new RegExp(cloudWords.join('|'), 'i')

  if (RE.test(bizplan.getBody())) return true

}

export { Bizplaner }
