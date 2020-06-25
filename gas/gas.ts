var Gas = (function () {
  'use strict'
  
  var VERSION = '0.1.0'
  
  var MAX_EXECUTION_TIME = 6 * 60 * 1000 // 6 mins - https://developers.google.com/apps-script/guides/services/quotas#current_quotas
  var MAX_LIFE_TIME      = MAX_EXECUTION_TIME / 6
  
  var START_TIME = (new Date()).getTime()
  
  return {
    getLifeTime:      getLifeTime
    , getLifeSeconds: function () { return Math.floor(getLifeTime() / 1000) }
    
    , isYourTime: function () { return getLifeTime() > MAX_LIFE_TIME }
  }
  
  
  ///////////////////////////////////////////////////////////
  
  function getLifeTime() {
    return (new Date()).getTime() - START_TIME
  }
}())
