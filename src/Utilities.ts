function importJsFromToFreshdesk() {
  // TODO: attachment link is not right
  
  var NUM_PER_RUN = 3
  
  var API_KEY = '5645a52f0cf2c287635773bc'
  var API_SECRET = 'eziLACQ59B3XdlajxW3BXE4xmo2UKqBS'
  
  var FORM_ID = '565e45b30cf217acf983bfd5'
  
  var FIELDS = {
    id:	'ID'
    , field57:	'您希望联系哪位合伙人'
    , field14:	'项目/产品叫什么（限10字）'
    , field1:	'用一句话说明白你的项目/产品（限70字）'
    , field2:	'你试图解决什么样的的痛点/问题（限70字）'
    , field3:	'为什么你的团队能胜任这个工作（限70字）'
    , field4:	'一句最能打动你的名言（限20字）'
    , field5:	'这只是个非常初步的想法，我也是个谨慎的人，我还需要验证一下模式'
    , field6:	'全力以赴，我将会把我所拥有的一切都投入到这个事业，不留退路'
    , field7:	'我已经投资了我大部分的财力和全部的精力，还会持续投入更多'
    , field8:	'我可以投一部分，但不是全部，或许未来会加大投入'
    , field9:	'还不能确定，我需要试错后才能决定'
    , field27:	'融多少钱？出让多少股份？（限20字）'
    , field30:	'IT技术'
    , field31:	'大数据'
    , field32:	'SaaS'
    , field33:	'金融'
    , field34:	'医疗健康'
    , field35:	'AR/VR'
    , field36:	'机器人'
    , field37:	'无人机相关'
    , field38:	'黑科技'
    , field39:	'电商'
    , field40:	'消费升级'
    , field41:	'区块链'
    , field42:	'互联网教育'
    , field43:	'游戏'
    , field44:	'文化'
    , field45:	'体育'
    , field46:	'工具类APP'
    , field47:	'Android'
    , field48:	'人工智能'
    , field49:	'物联网IOT'
    , field50:	'智能硬件'
    , field51:	'智能家居'
    , field52:	'车联网'
    , field53:	'营销技术'
    , field54:	'新媒体'
    , field55:	'社交'
    , field56:	'其他（以上完全没有）'
    , field21:	'上传文件（可以上传您的BP，可选项）(ID)'
    , field22:	'上传文件（可以上传您的BP，可选项）(文件类型)'
    , field23:	'上传文件（可以上传您的BP，可选项）(文件大小)'
    , field24:	'上传文件（可以上传您的BP，可选项）(文件名)'
    , field29:	'希望PreAngel Fund提供什么样的资源帮助您？'
    , field58:	'PA投资的项目创始人推荐'
    , field59:	'PA的LP推荐的'
    , field60:	'PA合伙人告诉我的'
    , field61:	'PA投资经理告诉我的'
    , field62:	'看了王利杰的文章'
    , field72:	'听了王利杰的演讲'
    , field63:	'微信群里看到的'
    , field64:	'看了媒体报道知道的'
    , field65:	'网上检索找到的'
    , field66:	'其他投资人推荐的'
    , field67:	'其他创业者推荐的'
    , field68:	'媒体记者推荐的'
    , field69:	'刷朋友圈刷到的'
    , field70:	'昨晚做梦突然梦到的'
    , field71:	'我有更奇葩的原因，这里没列'
    , field10:	'姓名'
    , field11:	'性别'
    , field12:	'Email'
    , field13:	'手机号码'
    , field25:	'微信号'
    , field15:	'生日'
    , field26:	'星座'
    , field28:	'公司注册名称（如果有的话）'
    , field16:	'网址（如果有的话）'
    , field18:	'地址(省/自治区/直辖市)'
    , field19:	'地址(市)'
    , field17:	'地址(区/县)'
    , field20:	'地址(详细地址)'
    , ext_value:	'扩展属性'
    , ip:	'IP地址'
    , create_by:	'创建人'
    , create_time:	'创建时间'
    , update_by:	'最后修改人'
    , update_time:	'最后修改时间'
    , time_out:	'填写耗时(秒)'
  }    
  
  var ENDPOINT = 'http://api.jsform.com/api/v1/entry/query'
  
  
  var scriptProperties = PropertiesService.getScriptProperties()
  
  var START_TIME = scriptProperties.getProperty('last_time')
  if (!START_TIME) START_TIME = (new Date(2016, 0, 17)).getTime()

  
  Logger.log(String(START_TIME))

  var payload = {
    form_id: FORM_ID
    , fields: Object.keys(FIELDS)
    ,filters: [{ 
      field: 'create_time' 
      , compare_type: 'gt' 
      , data_type: 'date' 
      , value: START_TIME
    }] 
    , order_by: { create_time: 1 }
    , page_size: NUM_PER_RUN
  }

  var AUTH_HEADER = {
    'Authorization': 'Basic ' + Utilities.base64Encode(API_KEY + ':' + API_SECRET)
  }

  var options = {
    muteHttpExceptions: false
    , headers: AUTH_HEADER
    , method: 'post'
    , contentType: 'application/json'
    , payload: JSON.stringify(payload)
  }

//  Logger.log(JSON.stringify(options))
  
  var response = UrlFetchApp.fetch(ENDPOINT, options)
  
//  retCode = response.getResponseCode()
//  Logger.log(retCode)
  
  retData = response.getContentText()
  retObj = JSON.parse(retData)
  
  retObj.rows.forEach(function (row) {
    var parsedRow = {}
    Object.keys(row).forEach(function (k) {
      parsedRow[FIELDS[k]] = row[k]
    })
    
    //Logger.log(JSON.stringify(parsedRow))
    
    var tableHtml = Object.keys(parsedRow).map(function (k) {
      return '<tr><td>' + k + '</td><td>' + parsedRow[k] + '</td></tr>'
    }).join('\n')
    tableHtml = '<table>' + tableHtml + '</table>'
    
    var req = {
      getThread: function () { return thread }
      , getMessage: function () { return message }
      
      , gasContact: new GasContact()
      , table: parsedRow
      , tableHtml: tableHtml
      //    , errors: []
    }
    
    var message = {
      getBody: function () { return tableHtml }
      , getSubject: function () { return row['field14'] } // field14	项目/产品叫什么（限10字）
    }
    var thread = {
      getMessages: function () { return [message] }
      , getFirstMessageSubject: function () { return row['field14'] }
    }
    
    var res = {}
    var next = function (e) { if (e) throw Error(e) }
    
    Bizplaner.logOnStart(req, res, next)
    
    Parser.table2Bizplan(req, res, next)  
    
    Ticketor.tryToPair(req, res, next)
    Ticketor.noteOrCreate(req, res, next)
    
    Bizplaner.analyzeDetails(req, res, next)
    
    Ticketor.process(req, res, next)
    
    Bizplaner.logOnEnd(req, res, next)
    
    scriptProperties.setProperty('last_time', String(row['create_time']))
  })
}