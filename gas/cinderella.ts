class Cinderella {

  static ENDPOINT = 'http://106.186.29.141:8838/Cinderella/GetInfo'

  static query (options) {
    var payload = {
      body     : options.body || '快塞给我一封邮件吧！',
      receiver : options.to || 'bupt@bupt.edu',
      sender   : options.from || 'zixia@zixia.net',
      sendtime : getSendTime(),
      subject  : options.subject || '测试demo',
      uploadFiles: undefined,
      // bug compatible
      // , uploadFiles: Utilities.newBlob('TEST DATA1').setName('test-data1.dat') // XXX bug compatible
    }

    if (options.attachments) {
      payload.uploadFiles = options.attachments[0]
    }

    // https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app#fetch(String,Object)
    //
    // Because payload is a JavaScript object, it will be interpreted as
    // an HTML form. (We do not need to specify contentType; it will
    // automatically default to either 'application/x-www-form-urlencoded'
    // or 'multipart/form-data')

    var headers = {
    }

    options = {
      muteHttpExceptions: true,
      method : "post",
      headers: headers,
      payload : payload,
    }

    var retObj = {}

    try {
      var resp = UrlFetchApp.fetch(this.ENDPOINT, options)
      var code = resp.getResponseCode()

      switch (true) {
        case /^2/.test(code):
          retObj = JSON.parse(resp.getContentText())
          retObj.error = false
          break;
        default:
          retObj.error = true
          retObj.description = resp.getContentText()
          break;
      }
      retObj.code = code
    } catch (e) {
      retObj.error = true
      retObj.description = e.message
    }

    //   DEBUG START
    // if (payload.uploadFiles) {
    //   payload.uploadFiles = payload.uploadFiles.map(function(f) {
    //     return f.getName() + ':' + f.getContentType()
    //   })
    // }

    payload.body = ''
    payload.uploadFiles = ''
    var testObj = {
      payload: payload,
      retObj: retObj,
    }

    return testObj
  }

}

function getSendTime () {
  var date = new Date()

  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  var hour = date.getHours()
  var minute = date.getMinutes()

  var sendtime = year + '-' + month + '-' + day + ' ' + hour + ':' + minute
  // Logger.log(sendtime)
  return sendtime
}

function testCinderella () {
  var file = Utilities.newBlob('TEST DATA1 北京 融资 项目 一百万 10%').setName('北京阿卡科技有限公司-大宝贝商业计划书')
  // file.getSize = function() { return '345' }

  Logger.log(JSON.stringify(Cinderella.query({
    attachments: [file],
  })))

}

export { Cinderella }
