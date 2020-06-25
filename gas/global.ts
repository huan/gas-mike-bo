'use strict'

/**
*
* 1. Log for GAS
*
*/
//let GasLog
//
//if ((typeof GasLog)==='undefined') { // GasL Initialization. (only if not initialized yet.)
//  var TTL = 3
//  var CODE = undefined
//  var errMsg = ''
//  while (!CODE && TTL--) {
//    try {
//      CODE = UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gasl/master/src/gas-log-lib.js').getContentText()
//    } catch (e) {
//      Logger.log('UrlFetchApp.fetch exception: ' + e.message)
//      errMsg = e.message
//      Utilities.sleep(1000)
//    }
//  }
//  if (CODE) eval(CODE)
//  else      throw new Error('GasLog library initial failed! [' + errMsg + ']');
//
//  Logger.log('GasLog:', GasLog)
//  Logger.log('GasLog.Printer:', GasLog.Printer)
//
//} // Class GasLog is ready for use now!

const GasLog = getGasLog()

var log = new GasLog({
  ident: 'MikeBo'
  , priority: 'NOTICE'
//  , priority: 'INFO'
//  , priority: 'DEBUG'
  , printer: new GasLog.Printer.Spreadsheet({
    spreadsheet: SpreadsheetApp.getActiveSpreadsheet()
    , sheetName: 'Logs'
    , clear: false
    , scroll: 'UP'
  })
})

//log(log.INFO, 'Hello, %s!', 'Spreadsheet')


/**
*
* 2. find a named sheet
*
*/
function getSheet(name: string) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name)

  // create log sheet if not exist
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(name)
    log(LOG_WARNING, 'Sheet Created for %s', name)
  }

  return sheet
}



/**
*
* 4. Export Reload Contacts Function
*
*/
function reloadContacts() {
  return GasContact.reloadContacts()
}
