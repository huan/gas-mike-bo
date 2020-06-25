/**
* test custom function
*
* @param {string} txt the number we're raising to a power
* @param {number} num the exponent we're raising the base to
* @return {string} the result of the exponential calculation
*/
function zixia (txt, num) {
  return 'zixiajj:' + txt + num
}

function showMySideBar () {
  var ui = SpreadsheetApp.getUi()
  ui.showSidebar(createUI())
}

function onOpen () {
  var ui = SpreadsheetApp.getUi()
  var mainMenu = ui.createMenu('MikeBo')
  mainMenu.addItem('Flip Selection Vertically', 'flipItMenuVertical')
  mainMenu.addItem('Flip Selection Horizontally', 'flipItMenuHorizontal')
  mainMenu.addSeparator()
  mainMenu.addItem('Show Side Bar', 'showMySideBar')
  mainMenu.addSeparator()
  mainMenu.addItem('Test Function', 'test')

  mainMenu.addToUi()

  ui.showSidebar(createUI())
}

function set_test () {
  var sheet = SpreadsheetApp.getActiveSheet()
  range = sheet.getRange(1, 1)
  range.setValue('test')
  return

  var selectedValues = sheet.getActiveRange().getValues()
  var range
  var startColIndex = sheet.getRange(target + '1').getColumn()

}

function flipItMenuVertical () {
  var ui = SpreadsheetApp.getUi()
  var result = ui.prompt('Destination', 'Please enter the column name to start in e.g. C :', ui.ButtonSet.OK_CANCEL)
  var button = result.getSelectedButton()
  var targetCell = result.getResponseText()

  if (button === ui.Button.OK) {
    flipSelection('vertical', targetCell)
  }
}

function flipItMenuHorizontal () {
  var ui = SpreadsheetApp.getUi()
  var result = ui.prompt('Destination', 'Please enter the column name to start in e.g. C :', ui.ButtonSet.OK_CANCEL)
  var button = result.getSelectedButton()
  var targetCell = result.getResponseText()
  if (button === ui.Button.OK) {
    flipSelection('horizontal', targetCell)
  }
}

function flipSelection (orientation, target) {
  var sheet = SpreadsheetApp.getActiveSheet()
  var selectedValues = sheet.getActiveRange().getValues()
  var range
  var startColIndex = sheet.getRange(target + '1').getColumn()
  sheet.getActiveRange().clear()
  if (orientation == 'horizontal') {
    for (var i = 0; i < selectedValues.length; i++) {
      range = sheet.getRange(1, startColIndex + i)
      range.setValue(String(selectedValues[i]))
    }
  } else if (orientation === 'vertical') {
    var vals = String(selectedValues[0]).split(',')
    var rowCount = 1
    vals.forEach(function (value) {
      range = sheet.getRange(rowCount, startColIndex)
      range.setValue(value)
      rowCount++
    })
  }
}

function createUI () {
  var app = UiApp.createApplication()
  app.setTitle('Flip Selection')

  var radioFlipVertical = app.createRadioButton('radioFlip').setId('radioFlipVertical').setText('Flip Selection Vertically.')
  var radioFlipHorizontal = app.createRadioButton('radioFlip').setId('radioFlipHorizontal').setText('Flip Selection Horizontally.')
  var buttonFlip = app.createButton('Flip Selection')
  var panel = app.createVerticalPanel()

  panel.add(radioFlipVertical)
  panel.add(radioFlipHorizontal)
  panel.add(buttonFlip)
  app.add(panel)

  var handlerRadioButtons = app.createServerHandler('radioButtonsChange')
  radioFlipVertical.addValueChangeHandler(handlerRadioButtons)
  radioFlipHorizontal.addValueChangeHandler(handlerRadioButtons)

  var handlerButton = app.createServerHandler('flipIt')
  buttonFlip.addClickHandler(handlerButton)

  return app
}

function flipIt (e) {
  var ui = SpreadsheetApp.getUi()

  var result = ui.prompt('Destination', 'Please enter the column name to start in e.g. C :', ui.ButtonSet.OK_CANCEL)
  var button = result.getSelectedButton()
  var targetCell = result.getResponseText()
  if (button === ui.Button.OK) {
    var selectedOption = ScriptProperties.getProperty('selectedRadio')
    if (selectedOption === 'radioFlipVertical') {
      flipSelection('vertical', targetCell)
    } else {
      flipSelection('horizontal', targetCell)
    }
  }
}

/*

//////////////////
var API_KEY = 'YOUR_API_KEY'
var FD_ENDPOINT = 'YOUR_DOMAIN.freshdesk.com'

var fdUrl = 'http://' + API_KEY + ':X@' + FD_ENDPOINT + '/helpdesk/tickets.json'

var data = {
  'helpdesk_ticket[email]': 'example@example.com',
  'helpdesk_ticket[subject]': 'Ticket title',
  'helpdesk_ticket[description]': 'Ticket description',
  'helpdesk_ticket[attachments][][resource]': {file: 'logo.png', content_type: 'image/png'}
}

needle.post(fdUrl, data, {multipart: true}, function(err, resp, body){
  console.log(body)
})
*/
