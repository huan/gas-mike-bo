function getGasFreshdesk () {
  /**
  *
  * GasFreshdesk - Freshdesk API Class for Google Apps Script
  *
  * GasFreshdesk is a easy to use Freshdesk API Class for GAS(Google Apps Script)
  * It provides a OO(Object-Oriented) way to use Freshdesk Ticket / Contacts, etc.
  *
  * Github - https://github.com/zixia/gas-freshdesk
  *
  * Example:
  ```javascript
  var MyFreshdesk = new GasFreshdesk('https://mikebo.freshdesk.com', 'Jrg0FQNzX3tzuHbiFjYQ')

  var ticket = new MyFreshdesk.Ticket({
    description:'A description'
    , subject: 'A subject'
    , email: 'you@example.com'
    , attachments: [ Utilities.newBlob('TEST DATA').setName('test-data.dat') ]
  })

  ticket.assign(9000658396)
  ticket.addNote({
    body: 'Hi tom, Still Angry'
    , private: true
  })
  ticket.setPriority(2)
  ticket.setStatus(2)

  ticket.del()
  ticket.restore()
  ```
  */

  /**
  *
  * Polyfill a dummy log function
  * in case of forget get rid of log in library(as developing/debuging)\
  *
  */
  // try {
  //   'use strict'
  //   var throwExceptionIfRightVariableNotExist = log;
  // } catch (e) { // not exist
  //   // Logger.log('Polyfill log: evaled in gas-freshdesk-lib')
  //   eval('var log = function () {}')
  // }

  var Freshdesk = function (url, key) {

    if (!key || !url) throw Error('options error: key or url not exist!')

    var http = new Http(url, key)


    /**
    * validateAuth: try to listTickets
    * if url & key is not right
    * exception will be thrown
    */
    validateAuth()


    this.http = http

    this.Ticket = freshdeskTicket
    this.Contact = freshdeskContact
    this.Agent = freshdeskAgent

    this.listTickets = freshdeskListTickets
    this.Ticket.list = freshdeskListTickets

    this.listContacts = freshdeskListContacts
    this.Contact.list = freshdeskListContacts

    this.listAgents = freshdeskListAgents
    this.Agent.list = freshdeskListAgents

    return this


    /**********************************************************************
    *
    * Freshdesk Instance Methods Implementation
    *
    */


    /**
    *
    * make a http call to api, in order to confirm the auth token is right.
    * @tested
    */
    function validateAuth () {
      // v1: return http.get('/helpdesk/tickets/filter/all_tickets?format=json')
      return http.get('/api/v2/tickets?per_page=1')
    }





  // export for testing only
  Freshdesk.Http = Http
  Freshdesk.validateHelpdeskObject = validateHelpdeskObject
  Freshdesk.validEmail = validateEmail
  Freshdesk.validateInteger = validateInteger

  return Freshdesk

  ///////////////////////////////////////////////////////////////////////////////////////
  //
  // Class Static Methods Implementation
  //
  ///////////////////////////////////////////////////////////////////////////////////////

}
