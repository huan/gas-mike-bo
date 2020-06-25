/* eslint-disable camelcase */
import { GasContact } from './gas-contacts'

interface BizplanOptionObject {
}

type BizplanOptions = BizplanOptionObject | GoogleAppsScript.Gmail.GmailMessage

class Bizplan {

  subject= ''
  body= ''
  from_name= ''
  from_email= ''
  to= ''
  cc= ''

  problem= ''
  solution= ''

  industry= ''
  location= ''
  company= ''
  web= ''

  pre_valuation = 0
  funding = 0

  founder = {
    email      : '',
    mobile     : '',
    name       : '',
    percentage : 0,
    title      : '',
  }

  attachments = []

  /**  */

  destination = '' // founder want to deliver bizplan to whom
  source = ''      // where this bizplan comes from (from marketing view)

  constructor (options: BizplanOptions) {
    switch (options.toString()) {
      case 'GmailMessage':
        this.initFromGmailMessage(options)
        break

      case '[object Object]': // optXXX
        this.initFromOptions(options)
        break

      default:
        throw Error('unknown constructor param for Bizplan')
    }

    return this

  }

  static pickAttachments (attachments) {
    if (!attachments) return []

    var totalSize = attachments
      .map(function (a) { return a.getSize() })
      .reduce(function (s1, s2) { return s1 + s2 }, 0)

    // URL Fetch POST size 10MB / call - https://developers.google.com/apps-script/guides/services/quotas?hl=en
    var MAX_SIZE = 10 * 1024 * 1024

    /**
    *
    * 1. return all the attachments if not exceed size limit
    *
    */
    if (totalSize < MAX_SIZE) return attachments

    /**
    *
    * 2. try to find out which attachment is more important
    *
    */

    var importantAttachments = []
    var RE = /(\.ppt|\.pptx|\.pdf)/i // get a ppt/pdf is enough

    /**
    *
    * How to deleting array items in javascript with forEach() and splice()
    *  - https://gist.github.com/chad3814/2924672
    *
    */
    var skipMarks = []

    // loop to check out bp format attachments first
    attachments.forEach(function (att, idx, obj) {
      var importantAttachmentsSize = importantAttachments
        .map(function (a) { return a.getSize() })
        .reduce(function (s1, s2) { return s1 + s2 }, 0)

      // 2.1 not bp format
      if (!RE.test(att.getName())) return
      // 2.2 exceed max size
      if ((importantAttachmentsSize + att.getSize()) > MAX_SIZE) return

      // 2.3 this attachment is "important", and move it to import list.
      importantAttachments.push(att)
      skipMarks[idx] = true
    })

    /**
    *
    * 3 2nd loop to check if not exceed max size, add more "not-important" attachments.
    *
    */
    attachments.forEach(function (att, idx, obj) {
      if (skipMarks[idx]) return

      var importantAttachmentsSize = importantAttachments
        .map(function (a) { return a.getSize() })
        .reduce(function (s1, s2) { return s1 + s2 }, 0)

      if ((importantAttachmentsSize + att.getSize()) > MAX_SIZE) return

      // 3.1 there is some room for this attachment
      importantAttachments.push(att)
      skipMarks[idx] = true

    })

    /**
    *
    * 4. keep other HUGE attachemt in the list, and set content to 'DROPPED' (drop the content)
    *
    */
    attachments.forEach(function (att, idx, obj) {
      if (skipMarks[idx]) return

      var replacedAtt = Utilities.newBlob('DOPPED').setName(att.getName() + '.txt')
      // replacedAtt.getSize = function () { return 8 }

      importantAttachments.push(replacedAtt)
      skipMarks[idx] = true
    })

    /**
    *
    * 5. finish
    *
    */
    return importantAttachments
  }

  //
  // Instance methods
  //

  setSubject (s) { this.subject = s || '(no subject)'}
  getSubject ()  { return this.subject }

  setBody (s) { this.body = s }
  getBody ()  { return this.body }

  setProblem (s) { this.problem = s }
  getProblem ()  { return this.problem }

  setSolution (s) { this.solution = s }
  getSolution ()  { return this.solution }

  setIndustry (s) { this.industry = s }
  getIndustry ()  { return this.industry }

  setLocation (s) { this.location = s }
  getLocation ()  { return this.location }

  setCompany (s) { this.company = s }
  getCompany ()  { return this.company }

  setWeb (s) { this.web = s }
  getWeb ()  { return this.web }

  setPreValuation (n) { this.pre_valuation = n }
  getPreValuation ()  { return this.pre_valuation }

  setFunding (n) { this.funding = n }
  getFunding ()  { return this.funding }

  setFounderName (s) { this.founder.name = s }
  getFounderName ()  { return this.founder.name }
  setFounderEmail (s) { this.founder.email = s }
  getFounderEmail ()  { return this.founder.email }
  setFounderMobile (s) { this.founder.mobile = s }
  getFounderMobile ()  { return this.founder.mobile }

  setAttachments (a) { if (a instanceof Array) this.attachments = a }
  getAttachments ()  { return this.attachments || [] }

  setFrom (s) {
    this.from_name  = GasContact.getEmailName(s)
    this.from_email = GasContact.getEmailAddress(s)
  }
  getFrom ()  {
    return (this.from_name ? this.from_name + ' ' : '') + '<' + this.from_email + '>'
  }
  setFromName (s)  { this.from_name = s }
  getFromName ()   { return this.from_name }
  setFromEmail (s) { this.from_email = s }
  getFromEmail ()  { return this.from_email }

  setTo (s) { this.to = s }
  getTo ()  { return this.to }

  setCc (s) { this.cc = s }
  getCc ()  { return this.cc }

  setDestination (s) { this.destination = s }
  getDestination ()  { return this.destination }

  setSource (s) { this.source = s }
  getSource ()  { return this.source }

  //
  // Instance private methods
  //

  private initFromGmailMessage (message) {
    var from = message.getReplyTo() || message.getFrom()

    var name = GasContact.getEmailName(from)
    var email = GasContact.getEmailAddress(from)

    this.setFrom(from)
    this.setTo(message.getTo())
    this.setCc(message.getCc())
    this.setSubject(message.getSubject())
    this.setBody(message.getBody())

    this.setAttachments(
      Bizplan.pickAttachments(
        message.getAttachments()
      )
    )

    this.setFounderName(name)
    this.setFounderEmail(email)
  }

  private initFromOptions (options) {
    Object.keys(options).forEach(k => {
      var method = k          // setFrom
      var value  = options[k] // 'zixia@zixia.net'

      if (!(method in this)) {
        throw Error('Bizplan.initFromOptions: unknown constructor param(' + k + ') for Bizplan')
      }

      (this as any)[k](value) // setFrom('zixia@zixia.net')
    })
  }

}

function testBizplan () {
  Logger.log(typeof GmailApp.getInboxThreads()[0].getMessages()[0])
  Logger.log(GmailApp.getInboxThreads()[0].getMessages()[0])
}

export { Bizplan }
