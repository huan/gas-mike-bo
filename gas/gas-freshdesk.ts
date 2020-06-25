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

    /**
    *
    * 1. Method Search Ticket
    *
    * @return {Array} Tickets of search. null for not found
    *
    * @param {Object} options
    *   email: email address of requester
    *
    * @document https://development.freshdesk.com/api#view_all_ticket
    *
    */
    function freshdeskListTickets (options) {

      var data

      if (options && options.email) { // Requester email
        var email = validateEmail(options.email)
        data = http.get('/api/v2/tickets?order_by=created_at&order_type=asc&email=' + encodeURIComponent(email))
      } else if (options && options.requester_id) {
        var requesterId = validateInteger(options.requester_id)
        data = http.get('/api/v2/tickets?order_by=created_at&order_type=asc&requester_id=' + requesterId)
      } else { // Uses the new_and_my_open filter.
        data = http.get('/api/v2/tickets')

      }

      if (!data || !data.length) return []

      var tickets = data.map(function (d) {
        return new freshdeskTicket(d.id)
      })

      return tickets
    }


    /**
    *
    * 2. Method Search Contact
    *
    */
    function freshdeskListContacts (options) {

      var email = options.email

      var data = http.get('/api/v2/contacts?email=' + encodeURIComponent(email))

      if (!data || !data.length) return []

      var contacts = data.map(function (d) {
        return new freshdeskContact(d.id)
      })

      return contacts
    }

    /**
    *
    * 3. Method Search Agent
    *
    * @param
    * options.email <String> email of agent
    *
    * @return
    * <Array> of <Agent>, or null for not found.
    *
    */
    function freshdeskListAgents (options) {

      var email = options.email

      var data = http.get('/api/v2/agents?email=' + encodeURIComponent(email))

      if (!data || !data.length) return []

      var agents = data.map(function (d) {
        return new freshdeskAgent(d.id)
      })

      return agents
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
