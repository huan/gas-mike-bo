function testBug () {

  if ((typeof GasFreshdesk)==='undefined') { // GasFreshdesk Initialization. (only if not initialized yet.)
    var CODE = UrlFetchApp.fetch('https://raw.githubusercontent.com/huan/gas-freshdesk/master/src/gas-freshdesk-lib.js').getContentText()
    eval(CODE)
  } // Class Freshdesk is ready for use now!

  var FRESHDESK_URL = PropertiesService.getScriptProperties().getProperty('FreshdeskDomainUrl')
  var FRESHDESK_KEY = PropertiesService.getScriptProperties().getProperty('FreshdeskApiKey')

  var MyFreshdesk = new GasFreshdesk(FRESHDESK_URL, FRESHDESK_KEY)
  var Ticket = MyFreshdesk.Ticket

  // 19480 will be ok
  var ticket = new Ticket(19480)
  ticket.close()

  Logger.log('ticket with 19480 is no exception')

  // 19426 will throw exception
  var ticket = new Ticket(19426)
  ticket.close()

  /**
  Execution failed:
  Error: Freshdesk API v2 failed when calling endpoint[https://zixia.freshdesk.com/api/v2/tickets/19426],
  options[{"muteHttpExceptions":true,"headers":{"Authorization":"Basic MjFRZ21hVVZaTE9rVVRxN0J0ZUM6WA=="},
  "method":"put","contentType":"application/json","payload":{"status":5}}],
  description[Validation failed] with error: (
    code[invalid_value],
    field[description],
    message[Should not be invalid_value/blank]
  )
  **/
  Logger.log('cant go here, because 19426 will throw exception')
}

function testSheet () {
  log('test')
  log('test1')
  log('test2')
  Logger.log('cant go here, because 19426 will throw exception')
}
