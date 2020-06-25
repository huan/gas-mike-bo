var GasContact = (function() {
  'use strict'

  var CONTACT_SHEET_NAME = 'Contacts'

  let EMAILS = []

  var STATIC_METHODS = {
      reloadContacts:   reloadContacts
    , getEmailName:     getEmailName
    , getEmailAddress:  getEmailAddress
    , isBeijingMobile:  isBeijingMobile
    , isMyContact:      isMyContact
    , mobileToLocation: mobileToLocation

    , companyToId: companyToId
    // for test
    , binary: binary
  }

  var GasContact = function () {
    INSTANCE_METHODS = {
    }

    var vm = {}

    // export static method on Instance
    Object.keys(STATIC_METHODS)  .forEach(function (k) { vm[k] = STATIC_METHODS[k]   })
    // export instance methods on Instance
    Object.keys(INSTANCE_METHODS).forEach(function (k) { vm[k] = INSTANCE_METHODS[k] })

    return vm

  }

  // export static methods on Class
  Object.keys(STATIC_METHODS).forEach(function (k) { GasContact[k] = STATIC_METHODS[k] })

  return GasContact


  /////////////////////////////////////////


  function isMyContact(email) {

    email = getEmailAddress(email)

    if (!email) return false

    if (!EMAILS.length) {
      const sheet = getSheet(CONTACT_SHEET_NAME)

      var lastRow = sheet.getLastRow();
      var emailRange = sheet.getRange(1,1,lastRow,1)

      // time cost about 1 second for getValues
      const values = emailRange.getValues()

      for (var i=0; i<values.length; i++) {
        // very important for compare as string!
        var stringValue = values[i][0].toString()
        EMAILS.push(stringValue)
      }

      EMAILS = EMAILS.sort()
    }

    var index = binary(EMAILS, email)

    return index != -1
  }

  function binary(list, value)
  {
    /**
    *
    * very important for compare as string!
    * or we could got NaN , which is much trouble for comparing...
    * https://stackoverflow.com/questions/34388974/
    *
    */
    if ((typeof value)!='string') value = value.toString()

    var left = 0, right = list.length - 1, mid = 0
    mid = Math.floor((left + right) / 2)
    while( left < right && list[mid] != value )
    {
      if (list[mid] < value ) {
        left = mid + 1
      } else if( list[mid] > value ) {
        right = mid - 1;
      }
      mid = Math.floor((left + right) / 2)
    }
    if( list[mid] == value ) return mid
    return -1
  }

  /**
  *
  * get all contacts from google, then save emails to a sheet cache.
  * run weekly is enough.
  *
  */
  function reloadContacts() {

    /**
    *
    * 1. Load contacts from google contact. (very slow, for minutes.)
    *
    */
    log(log.DEBUG, 'Start loading contacts...')

    var contacts = ContactsApp
    .getContactGroup('System Group: My Contacts')
    .getContacts()

    log(log.DEBUG, 'Contacts loaded.')

    /**
    *
    * 2. Translate google contacts to a ranged array
    *
    */
    var values = new Array()

    contacts.forEach(function(c) {
      emails = c.getEmails()

      if (!emails.length) return

      emails.forEach(function(e) {
        values.push([e.getAddress()])
      })
        })
    log(log.DEBUG, 'Email address loaded.')

    /**
    *
    * 3. Save emails to a sheet, for fast load in the furture use
    *
    */
    contactSheet = getSheet(CONTACT_SHEET_NAME)
    contactSheet.clear()

    var range = contactSheet.getRange(1,1, values.length, 1)

    range.setValues(values)

    var remainingDailyQuota = MailApp.getRemainingDailyQuota()

    log(log.NOTICE, 'GasContact reload: contacts: %s , emails: %s , mail quota left: %s .', contacts.length, values.length, remainingDailyQuota)

  }


  /**
  *
  * @param String emailString "Zhuohuan LI" <zixia@zixia.net>
  *
  * @return String|null zixia@zixia.net
  *
  */
  function getEmailAddress(emailString) {

    // Array
//    if (/,/.test(emailString)) {
    if (emailString.map) {
      return emailString.map(function (e) {
        return getEmailAddress(e)
      })
    }

    var RE = /([^<\s]+@[^>\s]+)>?$/
    var match = RE.exec(emailString)

    var email
    if (match) email = match[1]

    /**
    *
    * XXX Freshdesk API v2 not permit email address that include a plus(+) sign
    *
    */
    if (email) email = email.replace(/\+.+@/, '@')

    return email
  }

  function getEmailName(emailString) {

    if (!emailString) return null

    if (/,/.test(emailString)) {
      return emailString.split(/,/).map(function (e) {
        return getEmailName(e)
      })
    }

    var name = emailString
    .replace(/[^<\s]+@[^>\s]+/, '')
    .replace(/[<>]/g, '')
    .replace(/"/g, '')
    .replace(/^\s*/, '')
    .replace(/\s*$/, '')

    if (/@/.test(name)) {
      name = name.replace(/@.+$/, '')
    }

    return name ?
      name : emailString
  }

  function isBeijingMobile(mobile) {

    return /北京/.test(mobileToLocation(mobile))

    var SEARCH_URL = 'https://tcc.taobao.com/cc/json/mobile_tel_segment.htm?tel='

    var TTL = 3
    var response = undefined
    var retCode = undefined

    while (!retCode && TTL--) {
//      Logger.log('while loop ttl:'+TTL)
      try {
        response = UrlFetchApp.fetch(SEARCH_URL + mobile, {
                                     muteHttpExceptions: true
                                     })
        retCode = response.getResponseCode()
      } catch (e) {
        log(log.ERR, 'UrlFetchApp.fetch exception: %s, %s', e.name, e.message)
      }
    }

    if (retCode!=200) return false

    //    Logger.log(response.getContentText('GBK'))
    return /北京/.test(response.getContentText('GBK'))
  }

  function mobileToLocation(mobile) {

    var SEARCH_URL = 'http://apis.baidu.com/apistore/mobilenumber/mobilenumber?phone='

    var TTL = 3
    var response = undefined
    var retCode = undefined

    var headers = {
      apikey: '1cf55358456921fac91d19e886c04f8d'
    }

    while (!retCode && TTL--) {
      //      Logger.log('while loop ttl:'+TTL)
      try {
        response = UrlFetchApp.fetch(SEARCH_URL + mobile, {
                                     muteHttpExceptions: true
                                     , headers: headers
                                     })
        retCode = response.getResponseCode()
      } catch (e) {
        log(log.ERR, 'UrlFetchApp.fetch exception: %s, %s', e.name, e.message)
      }
    }

    if (retCode!=200) return false

    /**
    {
      errNum: 0
      , retData: {
        province:   北京
        , phone:    13911833788
        , city:     北京
        , prefix:   1391183
        , supplier: 移动
        , suit:     139卡
      }
      , retMsg: success
    }
    */
    var location = JSON.parse(response.getContentText())

    if (0 === location.errNum) return location.retData.city + ', ' + location.retData.province

    return false
  }

  /**
  *
  * Get registered shareholders from Goverment Office
  *
  */
  function companyToId(name) {

    var SEARCHLIST_URL    = 'http://apis.baidu.com/bertadata/enterprise/searchlist?keyword='
    var GETDETAILBUID_URL = 'http://apis.baidu.com/bertadata/enterprise/getdetailbyid?id='

    var TTL = 3
    var response = undefined
    var retCode = undefined

    var headers = {
      apikey: '1cf55358456921fac91d19e886c04f8d'
    }

    while (!retCode && TTL--) {
      //      Logger.log('while loop ttl:'+TTL)
      try {
        response = UrlFetchApp.fetch(SEARCHLIST_URL + name, {
                                     muteHttpExceptions: true
                                     , headers: headers
                                     })
        retCode = response.getResponseCode()
      } catch (e) {
        log(log.ERR, 'UrlFetchApp.fetch exception: %s, %s', e.name, e.message)
      }
    }

    if (retCode!=200) return false

    /**
    {
      data: {
        total: 17
        , num: 5
        , items: [
          {
            oper_name: 李卓桓
            , name: 北京阿卡科技有限公司
            , id: a2665c59-5f47-4522-a495-b238c51f7ac9
            , start_date: 2005-08-26
          }
          , {
            oper_name: 郑亚青
            , name: 星汉阿卡索环境科技（北京）有限公司
            , id: 254edee2-4e3b-47e9-9f7d-ec24c5408739
            , start_date: 2015-06-02
          }
        ]
      }
      , message: 查询成功
      , status=200
    }
    */
    var jsonStr = response.getContentText()
//    Logger.log(jsonStr)
    var list = JSON.parse(jsonStr)

    if (!list || !list.data || !list.data.items) return null

    var items = list.data.items

    var id
    for (var i=0; i<items.length; i++) {
      if (items[i].name == name) {
        id = items[i].id
        break
      }
    }

    if (!id) return null
    Logger.log('got id: ' + id)

    TTL = 3
    response = undefined
    retCode = undefined
    while (!retCode && TTL--) {
      //      Logger.log('while loop ttl:'+TTL)
      try {
        response = UrlFetchApp.fetch(GETDETAILBUID_URL + id, {
                                     muteHttpExceptions: true
                                     , headers: headers
                                     })
        retCode = response.getResponseCode()
      } catch (e) {
        log(log.ERR, 'UrlFetchApp.fetch exception: %s, %s', e.name, e.message)
      }
    }

    if (retCode!=200) return false

    var jsonStr = response.getContentText()
    var theCompany = JSON.parse(jsonStr)
    Logger.log(jsonStr)
    /**
    {
      data: {
        end_date: '-'
        , changerecords: [
          {
            change_date: 2014-05-09
            , before_content: '1 李卓桓 自然人股东 \n2 李曼利 自然人股东 '
            , after_content: '1 李卓桓 自然人股东 \n'
            , change_item: 投资人
          }
          , {
            change_date: 2014-05-09
            , before_content: 有限责任公司(自然人投资或控股)
            , after_content: 有限责任公司(自然人独资)
            , change_item=企业类型
          }
          , {
            change_item: "认缴的出资额认缴的出资方式认缴的出资时间实缴的出资额实缴的出资方式实缴的出资时间投资人"
            , change_date: "2013-04-24"
            , before_content: "1 李卓桓 85 自然人股东 \r\n2 张长军 9 自然人股东 \r\n3 于津凯 6 自然人股东 \r\n"
            , after_content:  "1 李卓桓 94 自然人股东 \r\n2 李曼利 6 自然人股东 \r\n"
          }
        ]
        , address: 北京市海淀区林业大学北路北侧清枫华景园1栋2单元602室
        , reg_no: 110108008861483
        , oper_name: 李卓桓
        , branches: []
        , term_start: 2005-08-26
        , partners: [
          {
            stock_type: 自然人股东
            , identify_no: ''
            , real_capi_items: []
            , name: 李卓桓
            , identify_type: ''
            , should_capi_items: []
          }
        , {
          stock_type: 自然人股东
          , identify_no: ''
          , real_capi_items: []
          , name: 李曼利
          , identify_type: ''
          , should_capi_items=[]
          }
        ]
        , check_date: 2014-05-09
        , scope: 技术开发、技术转让、技术咨询、技术服务；设计、制作、代理、发布广告。（依法须经批准的项目，经相关部门批准后方可开展经营活动）
        , name: 北京阿卡科技有限公司
        , belong_org: 海淀分局
        , term_end: 2025-08-25
        , employees: [
          {
            name: 李卓桓
            , job_title: 执行董事
          }
          , {
            name: 李卓桓
            , job_title: 总经理
          }
          , {
            name: 李曼利
            , job_title:监事
          }
        ]
        , regist_capi: 50万人民币
        , econ_kind: 有限责任公司(自然人独资)
        , start_date: 2005-08-26
        , status: 开业
      }
      , message: 查询成功
      , status: 200
    }
    */

    if (200 != theCompany.status || !theCompany.data) return null

    return theCompany.data.partners.map(function (p) {
      return p.name
    })



    var changeRecords = theCompany.data.changerecords
//    var partners = theCompany.data.partners
////    Logger.log(changeRecords)
//    var partnerNames = partners.map(function (p) {
//      return p.name
//    })


    var partnerCapital = {}
    if (/自然人独资/.test(theCompany.data.econ_kind)) {
      var operName = theCompany.data.oper_name
      partnerCapital[operName] = theCompany.data.regist_capi
    } else {
      changeRecords = changeRecords.filter(function (r) {
        if (/出资额/.test(r.change_item))      return true;
        else if (/投资人/.test(r.change_item)) return true;
        else                                   return false;
      })

      if (!changeRecords) return null

      changeRecords = changeRecords.sort(function (v1, v2) {
        // 距离现在进的日期排在前面
        return (new Date(v1.change_date)) < (new Date(v2.change_date))
      })

      var afterContent = changeRecords[0].after_content
      var match
      while (match = /\d+ +([^ ]+) +(\d+)?/g.exec(afterContent)) {
        // 有限责任公司："1 李卓桓 94 自然人股东 \r\n2 李曼利 6 自然人股东 \r\n"
        // 有限合伙： 1 李卓桓 自然人股东 \r\n2 林一仲 自然人股东 \r\n3 戴书文 自然人股东 \r\n
        partnerCapital[match[1]] = match[2] || ''
      }
    }
//    Logger.log(partnerCapital)

//    var totalCapital = Object.keys(partnerCapital)
//    .map(function (k) { return partnerCapital[k] })
//    .reduce(function (v1, v2) { return v1 + v2 }, 0)
//
//    for (var i=0; i < partnerCapital.length; i++) {
//      partnerCapital[i] = partnerCapital[i] / totalCapital
//    }
//
//    if (0 === location.errNum) return location.retData.city + ', ' + location.retData.province

    return partnerCapital
  }

}())

function testGasContact() {
  Logger.log('start')
//  Logger.log(GasContact.companyToId('北京阿卡科技有限公司'))
//  Logger.log(GasContact.companyToId('北京阿卡信息技术有限公司'))
  Logger.log(GasContact.companyToId('北京顺付投资管理中心（有限合伙）'))
//  Logger.log(GasContact.companyToId('北京顺付科技有限公司'))
//  Logger.log(GasContact.companyToId('青岛奥德莱三维打印有限公司'))
//  Logger.log(GasContact.companyToId('北京金慧丰投资管理有限公司'))
}
