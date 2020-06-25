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

    /******************************************************************
    *
    * Class Ticket
    * ------------
    */
    function freshdeskTicket (options) {

      if ((typeof this) === 'undefined') return new freshdeskTicket(options)

      var ticketObj = {}

      if ((typeof options) === 'number') {

        /**
        * 1. existing ticket, retried it by ID
        */

        id = options

        reloadTicket(id)

      } else if ((typeof options) === 'object') { // { x: y } options

        /**
        * 2. new ticket. create it.
        */

        if (!options.status) options.status = 2 // Status.Open
        if (!options.priority) options.priority = 1 // Priority.Low

        validateHelpdeskObject(options)
        // v1 ticketObj = http.post('/helpdesk/tickets.json', options)
        ticketObj = http.post('/api/v2/tickets', options)

      } else {
        // 3. error.
        throw Error('options must be integer or object')
      }

      this.getId = getTicketId
      this.getResponderId = getResponderId
      this.getRequesterId = getRequesterId
      this.assign = assignTicket
      this.note = noteTicket
      this.reply = replyTicket

      this.del = deleteTicket
      this.restore = restoreTicket

      this.getPriority = getTicketPriority
      this.setPriority = setTicketPriority

      this.getStatus = getTicketStatus
      this.setStatus = setTicketStatus

      this.getGroup = getTicketGroup
      this.setGroup = setTicketGroup

      this.open = function () { return setTicketStatus(2) }
      this.pend = function () { return setTicketStatus(3) }
      this.resolv = function () { return setTicketStatus(4) }
      this.close = function () { return setTicketStatus(5) }

      this.lowPriority = function () { return setTicketPriority(1) }
      this.mediumPriority = function () { return setTicketPriority(2) }
      this.highPriority = function () { return setTicketPriority(3) }

      this.getRawObj = function () { return ticketObj }

      //      this.setCustomField = setTicketCustomField
      //      this.setTag = setTicketTag


      return this

      ///////////////////////////////////////////////////////////

      function getTicketId () {
        // Logger.log(JSON.stringify(ticketObj))
        if (ticketObj && ticketObj.id) {
          return ticketObj.id
        }

        return null
      }

      function getResponderId () {

        if (ticketObj && ticketObj.responder_id) {
          return ticketObj.responder_id
        }

        return null
      }

      function getRequesterId () {

        if (ticketObj && ticketObj.requester_id) {
          return ticketObj.requester_id
        }

        return null
      }

      function assignTicket (responderId) {

//        v1:
//        http.put('/helpdesk/tickets/'
//                 + getTicketId()
//        + '/assign.json?responder_id='
//        + responderId
//        )

        http.put('/api/v2/tickets/' + getTicketId(), {
          responder_id: responderId
        })

        reloadTicket(getTicketId()) // refresh

        return this
      }

      function deleteTicket () {
        // v1: if ('deleted'==http.del('/helpdesk/tickets/' + getTicketId() + '.json')) {
        http.del('/api/v2/tickets/' + getTicketId())
        reloadTicket(getTicketId()) // refresh
        return true
      }

      /**
      *
      * @tested
      */
      function restoreTicket (id) {

        if (!id) id = getTicketId()

        if (id%1 !== 0) throw Error('ticket id(' + id + ') must be integer')

        // v1: var ret = http.put('/helpdesk/tickets/' + id + '/restore.json')
        var ret = http.put('/api/v2/tickets/' + id + '/restore')

        reloadTicket(getTicketId()) // refresh
        return this
      }

      /**
      *
      * Reload Ticket Object Raw Data
      *
      */
      function reloadTicket (id) {

        if (id%1 !== 0) throw Error('ticket id(' + id + ') must be integer.')
        // Logger.log('loading id:' + id)
        // v1: ticketObj = http.get('/helpdesk/tickets/' + id + '.json')
        // ticketObj = http.get('/api/v2/tickets/' + id + '?include=notes')
        ticketObj = http.get('/api/v2/tickets/' + id + '?include=conversations')
        // Logger.log(JSON.stringify(ticketObj))
        return this
      }

      /**
      *
      * Note a Ticket
      *
      * @tested
      */
      function noteTicket (data) {

        validateHelpdeskObject (data)

        // v1: var retVal = http.post('/helpdesk/tickets/' + getTicketId() + '/conversations/note.json', data)
        var retVal = http.post('/api/v2/tickets/' + getTicketId() + '/notes', data)

        if (retVal) {
          reloadTicket(getTicketId())
          return true
        }

        return false
      }

      /**
      *
      * Reply a Ticket
      *
      * @testing
      */
      function replyTicket (data) {

        validateHelpdeskObject (data)

        var retVal = http.post('/api/v2/tickets/' + getTicketId() + '/reply', data)

        if (retVal) {
          reloadTicket(getTicketId())
          return true
        }

        return false
      }

      /**
      *
      *
      * @tested
      */
      function getTicketPriority () { return ticketObj.priority }
      function setTicketPriority (priority) {
        // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
        var retVal = http.put('/api/v2/tickets/' + getTicketId(), {
          priority: priority
        })

        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }

        throw Error('set priority fail')
      }

      /**
      *
      *
      * @tested
      */
      function getTicketStatus () { return ticketObj.status }
      function setTicketStatus (status) {
        // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
        var retVal = http.put('/api/v2/tickets/' + getTicketId(), {
          status: status
        })

        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }

        throw Error('set status fail')
      }

      function getTicketGroup () { return ticketObj.group_id }
      function setTicketGroup (groupId) {
        var retVal = http.put('/api/v2/tickets/' + getTicketId(), {
          group_id: groupId
        })

        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }

        throw Error('set group fail')
      }

      function setTicketCustomField (customFields) {
        // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
        var retVal = http.put('/api/v2/tickets/' + getTicketId(), {
          custom_field: customFields
        })

        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }

        throw Error('set status fail')
      }

      function setTicketTag(tags) {

        throw Error('not implenment yet')

        var ticketTags = ticketObj.tags

//          "tags":[
//         {"name": "tag1"},
//         {"name": "tag2"}
//    ]

        // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
        var retVal = http.put('/api/v2/tickets/' + getTicketId(), {
          helpdesk: {
            tags: ticketTags
          }
        })

        if (retVal) {
          reloadTicket(getTicketId())
          return this
        }

        throw Error('set tags fail')
      }

      ////////////////////////////////
    }// Seprator of Ticket Instance
    ////////////////////////////////

    /***************************************************************************
    *
    * Class Contact
    * -------------
    */
    function freshdeskContact (options) {

      if ((typeof this) === 'undefined') return new freshdeskContact(options)

      var contactObj = {}

      if ((typeof options) === 'number') {

        /**
        * 1. existing contact, get it by ID
        */

        id = options

        reloadContact(id)
      } else if ((typeof options) === 'object') { // { x: y } options

        /**
        * 2. new contact. create it.
        */

        // v1: contactObj = http.post('/contacts.json', options)
        contactObj = http.post('/api/v2/contacts', options)

      } else {
        // 3. error.
        throw Error('options must be integer or options')
      }

      this.getId = getContactId

      this.del = deleteContact

      this.getName = getContactName
      this.setName = setContactName

      this.getEmail = getContactEmail

      this.getTitle = getContactTitle
      this.setTitle = setContactTitle

      this.getRawObj = function () { return contactObj }


      return this

      ////////////////////////////////////////////////////////

      function getContactId () {
        if (contactObj && contactObj.id) {
          return contactObj.id
        }

        return null
      }

      function deleteContact () {
        // v1: if ('deleted'==http.del('/contacts/' + getContactId() + '.json')) {
        if ('deleted'==http.del('/api/v2/contacts/' + getContactId())) {
          reloadContact(getContactId()) // refresh
          return true
        }
        return false
      }

      /**
      *
      * Reload Contact Object Raw Data
      *
      */
      function reloadContact (id) {

        if ((typeof id)=='undefined') id = getContactId()

        if (id%1 !== 0) throw Error('contact id(' + id + ') must be integer.')

        // v1: contactObj = http.get('/contacts/' + id + '.json')
        contactObj = http.get('/api/v2/contacts/' + id)

        return this
      }

      /**
      *
      *
      * @testing
      */
      function getContactName () {
        return contactObj.name
      }
      function setContactName (name) {
        // v1: var retVal = http.put('/contacts/' + getContactId() + '.json', {
        var retVal = http.put('/api/v2/contacts/' + getContactId(), {
          name: name
        })

        if (retVal) {
          reloadContact ()
          return this
        }

        throw Error('set name fail')
      }

      function getContactEmail () {
        return contactObj.email
      }

      /**
      *
      *
      * @testing
      */
      function getContactTitle () { return contactObj.job_title }
      function setContactTitle (title) {
        // v1: var retVal = http.put('/contacts/' + getTicketId() + '.json', {
        var retVal = http.put('/api/v2/contacts/' + getTicketId(), {
          user: {
            job_title: title
          }
        })

        if (retVal) {
          reloadContact()
          return this
        }

        throw Error('set status fail')
      }


      ////////////////////////////////
    }// Seprator of Contact Instance
    ////////////////////////////////


    /***************************************************************************
    *
    * Class Agent
    * -----------
    */
    function freshdeskAgent (id) {

      if ((typeof this) === 'undefined') return new freshdeskAgent(options)

      var agentObj = {}

      if ((typeof id) === 'number') {

        /**
        * 1. existing agent, get it by ID
        */

        // load #id to agentObj
        reloadAgent(id)

      } else {
        // 2. error.
        throw Error('id must be integer')
      }

      this.getId = getAgentId
      this.getName = getAgentName

      this.getRawObj = function () { return agentObj }


      return this

      ///////////////////////////////////////////////

      function getAgentId () {
        if (agentObj && agentObj.id) {
          return agentObj.id
        }

        return null
      }

      function getAgentName () {
        return agentObj.contact.name
      }

      /**
      *
      * Reload Agent Object Raw Data
      *
      */
      function reloadAgent (id) {

        if ((typeof id)=='undefined') id = getAgentId()

        if (id%1 !== 0) throw Error('agent id(' + id + ') must be integer.')

        // v1: agentObj = http.get('/agents/' + id + '.json')
        agentObj = http.get('/api/v2/agents/' + id)

        return this
      }

      ////////////////////////////////
    }// Seprator of Agent Instance
    ////////////////////////////////

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




  /**
  *
  * return email if valid
  * throw exception if NOT valid
  *
  */
  function validateEmail (email) {
    var RE=/<?[a-z0-9\-_.]+@[a-z0-9\-_]+\.[a-z0-9\-_.]+>?$/i

    if (RE.test(email)) return email

    throw Error('invalid email: [' + email + ']')
  }

  function validateInteger (num) {
    if (num%1===0) return num
    else throw Error('invalid integer: [' + num + ']')
  }

  /**
  * freshdesk api v2 has better error checking for us.
  */
  function validateHelpdeskObject (obj) {

    if (!obj || (typeof obj!=='object')) throw Error('invalid helpdesk object: it is not object.')

    if (obj.email) validateEmail(obj.email)

    // unknown treat as ok
    return true
  }

}
