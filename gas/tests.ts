function mikeTestRunner() {

  const GasTap = getGasTap()
  var test = new GasTap()

  ///////////////////////////////////////
  //
//  return development() + test.finish()
//  return testBizplan() + test.finish()
//  return testParser() + test.finish()
  return testGasContact() + test.finish()
  //
  ///////////////////////////////////////

  /////////////////////////////////////
  //
  //

  testGasContact()
  testParser()
  testBizplan()
  testMailer()

  //
  //
  /////////////////////////////////////

  return test.finish()

  ///////////////////////////////////////////////

  function development() {
    testParser()
  }

  function testParser() {
    test('mapTable', function (t) {
      var EXPECT_A = 'AAA'
      var TABLE = {
        'xAx': EXPECT_A
      }
      var obj = {
        a: 'A'
        , b: 'B'
      }

      obj = Parser.mapTable(obj, TABLE)

      t.equal(obj.a, EXPECT_A, 'extracted a')
      t.ok(!obj.b, 'extracted b as empty')
    })

    test('MikeCRM', function (t) {
      var HTML = HtmlService.createHtmlOutputFromFile('TestData_Mikecrm').getContent()

      var message = MockGmailMessage({
        optBody:          HTML
        , optSubject:     'dummy subject'
      })

      var thread = {
        getMessages: function () { return [message] }
      }
      var req = {
        getThread: function () { return thread }
        , getMessage: function () { return message }
      }
      var res = {}
      var next = function () {}

      Bizplaner.init(req, res, next)
      Parser.mikecrm(req, res, next)

      var EXPECTED_KEY = '创投平台项目地址'
      var EXPECTED_VAL = '暂时性没有在任何平台上登记'
      var EXPECTED_EMAIL = '27109125@qq.com'

      var bizplan = req.bizplan
      t.equal(bizplan.table[EXPECTED_KEY], EXPECTED_VAL, 'mikecrm parse right')

      t.equal(bizplan.getFromEmail(), EXPECTED_EMAIL, 'apply email ok')
    })

    test('JsForm', function (t) {
      var HTML = [
        '<table ><tbody><tr><th>项目/产品叫什么（限10字）</th><td>极速学院</td></tr>'
        , '<tr><th>Email</th><td><a title="发送邮件到此邮箱" href="mailto:renjincheng@126.com" target="_blank">renjincheng@126.com</a></td></tr></tbody></table>'
      ].join('')

      var message = MockGmailMessage({
        optBody:          HTML
        , optSubject:     'dummy subject'
      })
      var thread = {
        getMessages: function () { return [message] }
      }
      var req = {
        getThread: function () { return thread }
        , getMessage: function () { return message }
      }
      var res = {}
      var next = function (e) { if (e) throw Error(e) }

      Bizplaner.init(req, res, next)
      Parser.jsform(req, res, next)

      t.ok(req.bizplan, 'parse bizplan ok')

      var EXPECTED_KEY = '项目/产品叫什么（限10字）'
      var EXPECTED_VAL = '极速学院'
      var EXPECTED_EMAIL = '<renjincheng@126.com>'

      var bizplan = req.bizplan

      t.ok(bizplan.table, 'parse table ok')
      t.equal(bizplan.table[EXPECTED_KEY], EXPECTED_VAL, 'jsform parse right')

      t.equal(req.bizplan.getFrom(), EXPECTED_EMAIL, 'bizplan email ok')
      t.equal(req.bizplan.getSubject(), EXPECTED_VAL, 'bizplan subject ok')

    })


    test('Intviu', function (t) {
      var HTML = HtmlService.createHtmlOutputFromFile('TestData_Intviu').getContent()

      var message = MockGmailMessage({
        optBody:          HTML
        , optSubject:     'dummy subject'
      })
      var thread = {
        getMessages: function () { return [message] }
      }
      var req = {
        getThread: function () { return thread }
        , getMessage: function () { return message }
        , pushError: function (e) { throw e }
      }
      var res = {}
      var next = function (e) { if (e) throw Error(e) }

      Bizplaner.init(req, res, next)
      Parser.intviu(req, res, next)

      var EXPECTED_KEY = '面试邮箱：'
      var EXPECTED_VAL = '123418697@qq.com'
      var EXPECTED_EMAIL = '123418697@qq.com'

      t.ok(req.bizplan, 'parse interview ok')

      var bizplan = req.bizplan

      t.ok(bizplan.table, 'parse table ok')
      t.equal(bizplan.table[EXPECTED_KEY], EXPECTED_VAL, 'intviu parse right')

      t.equal(bizplan.getFromEmail(), EXPECTED_EMAIL, 'interview email ok')
    })
  }

  function testGasContact() {
    test('GasContact', function (t) {
      var LIST = [ 0,1,2,3,4,5,6,7,8,9 ]
      var EXIST_VALUE = 7
      var EXPECTED_EXIST_INDEX = 7

      var index = GasContact.binary(LIST, EXIST_VALUE)
      t.equal(index, EXPECTED_EXIST_INDEX, 'binary search for exist value')

      var NOEXIST_VALUE=99
      var EXPECTED_NOEXIST_INDEX = -1
      index = GasContact.binary(LIST, NOEXIST_VALUE)
      t.equal(index, EXPECTED_NOEXIST_INDEX, 'binary search for no exist value')
    })

    test('GasContact', function (t) {
      ///////////////////////////////////////////////////////////////
      var MY_CONTACT_EMAIL = 'zixia@zixia.net'
      var NOT_MY_CONTACT_EMAIL = 'fasdfaas.com.xx'
      var c = new GasContact()
      var isExist = c.isMyContact(MY_CONTACT_EMAIL)
      t.ok(isExist, 'isMyContact return exist')

      var isNotExist = (false===c.isMyContact(NOT_MY_CONTACT_EMAIL))
      t.ok(isNotExist, 'isMyContact return not exist')

      var FROM = '腾讯企业邮箱 <10000@qq.com>'
      var EXPECTED_EMAIL = '10000@qq.com'
      var email = GasContact.getEmailAddress(FROM)
      t.equal(email, EXPECTED_EMAIL, 'extract email address')


      var FROM = '"qsw@qushuawang.com" <qsw@qushuawang.com>'
      var EXPECTED_EMAIL = 'qsw@qushuawang.com'
      var email = GasContact.getEmailAddress(FROM)
      t.equal(email, EXPECTED_EMAIL, 'extract email address with quota')


      var FROM = 'Leon Y Zhang @ Savills, CD <LeonY.Zhang@savills.com.cn>'
      var EXPECTED_EMAIL = 'LeonY.Zhang@savills.com.cn'
      var email = GasContact.getEmailAddress(FROM)
      t.equal(email, EXPECTED_EMAIL, 'extract email address with "@/,"')
      ///////////////////////////////////////////////////////////////
    })

    test('GasContact', function (t) {
      var BEIJING_MOBILE = '13911833788'
      var UNKNOWN_MOBILE = '99999999999'

      var isBeijing = GasContact.isBeijingMobile(BEIJING_MOBILE)
      t.ok(isBeijing, 'beijing mobile')

      var isNotBeijing = !GasContact.isBeijingMobile(UNKNOWN_MOBILE)
      t.ok(isNotBeijing, 'unknown mobile')
    })
  }

  function testBizplan() {
    test('Bizplan', function (t) {
      var BP_DESCRIPTION = '<h1>description</h1>'
      var BP_SUBJECT = 'Bizplan1'
      var BP_FROM_NAME = 'Test'
      var BP_FROM_EMAIL = 'test@test.com'
      var BP_FROM = BP_FROM_NAME + ' <' + BP_FROM_EMAIL + '>'
      var BP_TO = 'zixia@zixia.net'

      var BP_ATTACHMENT_NAME = 'test-data.dat'
      var BP_ATTACHMENT = MockGmailAttachment('dat', 1).setName(BP_ATTACHMENT_NAME)

      var message = MockGmailMessage({
        optBody:          BP_DESCRIPTION
        , optSubject:     BP_SUBJECT
        , optReplyTo:     BP_FROM
        , optFrom:        BP_FROM
        , optTo:          BP_TO
        , optAttachments: [BP_ATTACHMENT]
      })

      var bizplan =  new Bizplan(message)

      t.equal(bizplan.getSubject(), BP_SUBJECT, 'bp subject')
      t.equal(bizplan.getBody(), BP_DESCRIPTION, 'bp description')
      t.equal(bizplan.getFounderName(), BP_FROM_NAME, 'bp founder name')
      t.equal(bizplan.getFounderEmail(), BP_FROM_EMAIL, 'bp founder email')
      t.equal(bizplan.getAttachments()[0].getName(), BP_ATTACHMENT_NAME, 'bp attachment name')

    })

    test('Bizplan filterAttachments', function (t) {

      var ATTACHMENTS = [
        MockGmailAttachment  ('dat',  1 )
        , MockGmailAttachment('doc',  1 )
        , MockGmailAttachment('pdf',  1 )
        , MockGmailAttachment('png',  1 )
        , MockGmailAttachment('jpg',  1 )
        , MockGmailAttachment('ppt',  1 )
        , MockGmailAttachment('ppt',  10)
        , MockGmailAttachment('pptx', 1 )
        , MockGmailAttachment('pdf',  10)
        , MockGmailAttachment('pdf',  2 )
        , MockGmailAttachment('jpg',  2 )
      ]

      var importantAttachments = Bizplan.pickAttachments(ATTACHMENTS)

      t.equal(importantAttachments[0].getName(), '1MB.pdf', 'important[0]')
      t.equal(importantAttachments[1].getName(), '1MB.ppt', 'important[1]')

      var totalSize = importantAttachments
      .map(function(a) { return a.getSize() })
      .reduce(function(s1,s2) { return s1 + s2 }, 0)

      t.ok(totalSize <= 1024*1024*10, 'not greater than 10MB')
    })
  }

  function testMailer() {
    test ('Mailer', function (t) {
      var exist = Mailer.isAllLabelsExist()
      t.ok(exist, 'All labels exist')
    })
  }

  /////////////////////////////////

  function MockGmailAttachment(type, size) {
    var NAME = size + 'MB.' + type
    return {
      getName:   function () { return NAME }
      , getSize: function () { return size * 1024 * 1024 }
      , setName: function (name) { NAME = name; return this }

      , toString: function () { return 'GmailAttachment' }
    }
  }

  function MockGmailMessage(options) {
    return {
      getBody:    function () { return options.optBody }
      , getSubject: function () { return options.optSubject }
      , getReplyTo: function () { return options.optReplyTo }
      , getFrom:    function () { return options.optFrom }
      , getTo:      function () { return options.optTo }
      , getCc:      function () { return options.optCc }
      , getAttachments: function () { return options.optAttachments }

      , toString: function () { return 'GmailMessage' }
    }
  }
}
