var Tracker = (function () {
  'use strict'
  
  var VERSION = '0.1.0'
    
  return {
    // Middle Wares
    logOnStart: logOnStart
    , logOnEnd: logOnEnd
    
    , logOnTime: logOnTime
  }
  
  
  ///////////////////////////////////////////////////////////
  
  function logOnStart(req, res, next) {
    Mailer.labelAdd_Busy(req, res, next)

    req.startTime = new Date()
    log(log.DEBUG, '%s start processing %s'
        , req.getChannelName ? req.getChannelName() : 'unknown'
        , req.getMessage     ? req.getMessage().getSubject() : 'unknown'
       )
    
    Mailer.labelAdd_Bug (req, res, next)
    Mailer.labelAdd_Mike(req, res, next)

    return next()
  }
  
  function logOnEnd(req, res, next) {   
    var errors   = req.getErrors()
    var errorMsg = ''
    var noException = true
    
    if (errors && errors.length) {
      errorMsg = errors.map(function (e) { 
        if (e instanceof Error) {
          noException = false
          return e.name + ':' + e.message + ':' + e.stack
        } else {
          return e || ''
        }
      }).join(',')
    }
    
    if (noException) Mailer.labelDel_Bug(req, res, next)
    
    log(log.NOTICE, 'C(%s/%ss)[%s] %s'
        , req.getChannelName ? req.getChannelName() : 'unknown channel'
        , Math.floor((new Date() - req.startTime)/1000)
        
        , req.getMessage ? req.getMessage().getSubject() : 'unknown message subject'
        , errorMsg
       )
    
    Mailer.labelDel_Busy(req, res, next)
    return next()
  }
  
  function logOnTime(req, res, next) {
    req.pushError('time(' + (new Date() - req.startTime)/1000 + ')')
    return next()
  }
  
  
}())
