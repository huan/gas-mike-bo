var Bizplan = (function () {
  'use strict'

  var VERSION = '0.1.0'

  var STATIC_METHODS = {
    pickAttachments: pickAttachments
  }

  /**
  *
  * Class Bizplan Constructor
  *
  */
  var Bizplan = function (options) {

    if (typeof this === 'undefined' || Object.keys(this).length) throw Error('must use "new" keyword to Bizplan') // called instead of 'newed'
    if (typeof options !== 'object') throw Error('param must be a object')

    var BP = {
      subject: ''
      , body: ''
      , from_name: ''
      , from_email: ''
      , to: ''
      , cc: ''

      , problem: ''
      , solution: ''

      , industry: ''
      , location: ''
      , company: ''
      , web: ''

      , pre_valuation: 0
      , funding: 0

      , founder: {
        name: ''
        , email: ''
        , mobile: ''
        , title: ''
        , percentage: 0
      }

      , attachments: []

      //////////////////////

      , destination: '' // founder want to deliver bizplan to whom
      , source: ''      // where this bizplan comes from (from marketing view)
    }


    var INSTANCE_METHODS = {
        setSubject: setSubject
      , getSubject: getSubject

      , setBody: setBody
      , getBody: getBody

      , setProblem: setProblem
      , getProblem: getProblem

      , setSolution: setSolution
      , getSolution: getSolution

      , setIndustry: setIndustry
      , getIndustry: getIndustry

      , setLocation: setLocation
      , getLocation: getLocation

      , setCompany: setCompany
      , getCompany: getCompany

      , setPreValuation: setPreValuation
      , getPreValuation: getPreValuation

      , setFunding: setFunding
      , getFunding: getFunding

      , setFounderName: setFounderName
      , getFounderName: getFounderName
      , setFounderEmail: setFounderEmail
      , getFounderEmail: getFounderEmail
      , setFounderMobile: setFounderMobile
      , getFounderMobile: getFounderMobile

      , getAttachments: getAttachments
      , setAttachments: setAttachments

      , setFrom: setFrom
      , getFrom: getFrom
      , setFromEmail: setFromEmail
      , getFromEmail: getFromEmail
      , setFromName:  setFromName
      , getFromName:  getFromName

      , setTo: setTo
      , getTo: getTo

      , setCc: setCc
      , getCc: getCc

      , setDestination: setDestination
      , getDestination: getDestination

      , setWeb: setWeb
      , getWeb: getWeb

      , setSource: setSource
      , getSource: getSource

    }

    /**
    *
    * init Bizplan from different type of param
    *
    */
    switch (options.toString()) {
      case 'GmailMessage':
        initFromGmailMessage(options)
        break;

      case '[object Object]': // optXXX
        initFromOptions(options)
        break;

      default:
        throw Error('unknown constructor param for Bizplan')
    }

    /////////////////////////////////////////
    // export static method on Instance
    Object.keys(STATIC_METHODS)  .forEach(function (k) { this[k] = STATIC_METHODS[k]   }, this)
    // export instance methods on Instance
    Object.keys(INSTANCE_METHODS).forEach(function (k) { this[k] = INSTANCE_METHODS[k] }, this)
    /////////////////////////////////////////

    return this

    ////////////////////////////////////////////////////
    //
    // Instance methods
    //
    function setSubject(s) { BP.subject = s || '(no subject)'}
    function getSubject()  { return BP.subject }

    function setBody(s) { BP.Body = s }
    function getBody()  { return BP.Body }

    function setProblem(s) { BP.problem = s }
    function getProblem()  { return BP.problem }

    function setSolution(s) { BP.solution = s }
    function getSolution()  { return BP.solution }

    function setIndustry(s) { BP.industry = s }
    function getIndustry()  { return BP.industry }

    function setLocation(s) { BP.location = s }
    function getLocation()  { return BP.location }

    function setCompany(s) { BP.company = s }
    function getCompany()  { return BP.company }

    function setWeb(s) { BP.web = s }
    function getWeb()  { return BP.web }

    function setPreValuation(n) { BP.pre_valuation = n }
    function getPreValuation()  { return BP.pre_valuation }

    function setFunding(n) { BP.funding = n }
    function getFunding()  { return BP.funding }

    function setFounderName(s) { BP.founder.name = s }
    function getFounderName()  { return BP.founder.name }
    function setFounderEmail(s) { BP.founder.email = s }
    function getFounderEmail()  { return BP.founder.email }
    function setFounderMobile(s) { BP.founder.mobile = s }
    function getFounderMobile()  { return BP.founder.mobile }

    function setAttachments(a) { if (a instanceof Array) BP.attachments = a }
    function getAttachments()  { return BP.attachments || [] }

    function setFrom(s) {
      BP.from_name  = GasContact.getEmailName(s)
      BP.from_email = GasContact.getEmailAddress(s)
    }
    function getFrom()  {
      return (BP.from_name ? BP.from_name + ' ' : '') + '<' + BP.from_email + '>'
    }
    function setFromName(s)  { BP.from_name = s }
    function getFromName()   { return BP.from_name }
    function setFromEmail(s) { BP.from_email = s }
    function getFromEmail()  { return BP.from_email }

    function setTo(s) { BP.to = s }
    function getTo()  { return BP.to }

    function setCc(s) { BP.cc = s }
    function getCc()  { return BP.cc }

    function setDestination(s) { BP.destination = s }
    function getDestination()  { return BP.destination }

    function setSource(s) { BP.source = s }
    function getSource()  { return BP.source }

    ////////////////////////////////////
    //
    // Instance private methods
    //

    function initFromGmailMessage(message) {
      var from = message.getReplyTo() || message.getFrom()

      var name = GasContact.getEmailName(from)
      var email = GasContact.getEmailAddress(from)

      setFrom       (from)
      setTo         (message.getTo())
      setCc         (message.getCc())
      setSubject    (message.getSubject())
      setBody(message.getBody())

      setAttachments(
        pickAttachments(
          message.getAttachments()
        )
      )

      setFounderName (name)
      setFounderEmail(email)
    }

    function initFromOptions(options) {
      Object.keys(options).forEach(function (k) {
        var method = k          // setFrom
        var value  = options[k] // 'zixia@zixia.net'

        var func = INSTANCE_METHODS[k]
        if (!func) throw Error('Bizplan.initFromOptions: unknown contructor param(' + k + ') for Bizplan')

        func[k](value) // setFrom('zixia@zixia.net')
      })
    }

  }

  //
  // Instance Constructor END
  //
  ////////////////////////////////////////////////////////////////////////////////



  // export static methods on Class
  Object.keys(STATIC_METHODS).forEach(function (k) { Bizplan[k] = STATIC_METHODS[k] })



  return Bizplan



  ////////////////////////////////////////////////////////////////////////////////
  //
  // Class Static methods
  //

  function pickAttachments(attachments) {
    if (!attachments) return []

    var totalSize = attachments
    .map(function(a) { return a.getSize() })
    .reduce(function(s1,s2) { return s1 + s2 }, 0)

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
      .map   (function (a) { return a.getSize() })
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
      .map   (function (a) { return a.getSize() })
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
//      replacedAtt.getSize = function () { return 8 }

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

}())

function testBizplan() {
  Logger.log(typeof GmailApp.getInboxThreads()[0].getMessages()[0])
  Logger.log(GmailApp.getInboxThreads()[0].getMessages()[0])
}
