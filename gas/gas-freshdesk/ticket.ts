/* eslint-disable camelcase */
/******************************************************************
 *
 * Class Ticket
 * ------------
 */
import { Http } from './http'
import {
  validateHelpdeskObject,
  validateEmail,
  validateInteger,
}                           from './utils'

function getTicket (http: Http) {

  return class Ticket {

    ticketObj: any = {}

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
    static findAll (
      options?: {
        email?: string,
        requester_id?: number,
      },
    ) {

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

      var tickets = data.map(function (d: any) {
        return new Ticket(d.id)
      })

      return tickets
    }

    constructor (options: any) {
      if ((typeof options) === 'number') {

        /**
        * 1. existing ticket, retried it by ID
        */

        const id = options

        this.reloadTicket(id)

      } else if ((typeof options) === 'object') { // { x: y } options

        /**
        * 2. new ticket. create it.
        */

        if (!options.status) options.status = 2 // Status.Open
        if (!options.priority) options.priority = 1 // Priority.Low

        validateHelpdeskObject(options)
        // v1 ticketObj = http.post('/helpdesk/tickets.json', options)
        this.ticketObj = http.post('/api/v2/tickets', options)

      } else {
        // 3. error.
        throw Error('options must be integer or object')
      }

    }

    open () { return this.setTicketStatus(2) }
    pend () { return this.setTicketStatus(3) }
    resolve () { return this.setTicketStatus(4) }
    close () { return this.setTicketStatus(5) }

    lowPriority () { return this.setTicketPriority(1) }
    mediumPriority () { return this.setTicketPriority(2) }
    highPriority () { return this.setTicketPriority(3) }

    getRawObj () { return this.ticketObj }

    //      this.setCustomField = setTicketCustomField
    //      this.setTag = setTicketTag

    getTicketId () {
      // Logger.log(JSON.stringify(ticketObj))
      if (this.ticketObj && this.ticketObj.id) {
        return this.ticketObj.id
      }

      return null
    }

    getResponderId () {

      if (this.ticketObj && this.ticketObj.responder_id) {
        return this.ticketObj.responder_id
      }

      return null
    }

    getRequesterId () {

      if (this.ticketObj && this.ticketObj.requester_id) {
        return this.ticketObj.requester_id
      }

      return null
    }

    assignTicket (responderId) {

      // v1:
      // http.put('/helpdesk/tickets/'
      //         + getTicketId()
      // + '/assign.json?responder_id='
      // + responderId
      // )

      http.put('/api/v2/tickets/' + this.getTicketId(), {
        responder_id: responderId,
      })

      this.reloadTicket(this.getTicketId()) // refresh

      return this
    }

    deleteTicket () {
      // v1: if ('deleted'==http.del('/helpdesk/tickets/' + getTicketId() + '.json')) {
      http.del('/api/v2/tickets/' + this.getTicketId())
      this.reloadTicket(this.getTicketId()) // refresh
      return true
    }

    /**
    *
    * @tested
    */
    restoreTicket (id: number) {

      if (!id) id = this.getTicketId()

      if (id % 1 !== 0) throw Error('ticket id(' + id + ') must be integer')

      // v1: var ret = http.put('/helpdesk/tickets/' + id + '/restore.json')
      const ret = http.put('/api/v2/tickets/' + id + '/restore')
      void ret

      this.reloadTicket(this.getTicketId()) // refresh
      return this
    }

    /**
    *
    * Reload Ticket Object Raw Data
    *
    */
    reloadTicket (id?: number) {

      if (typeof id === 'undefined') {
        id = this.getTicketId()
      }

      // Logger.log('loading id:' + id)
      // v1: ticketObj = http.get('/helpdesk/tickets/' + id + '.json')
      // ticketObj = http.get('/api/v2/tickets/' + id + '?include=notes')
      this.ticketObj = http.get('/api/v2/tickets/' + id + '?include=conversations')
      // Logger.log(JSON.stringify(ticketObj))
      return this
    }

    /**
    *
    * Note a Ticket
    *
    * @tested
    */
    noteTicket (data) {

      validateHelpdeskObject(data)

      // v1: var retVal = http.post('/helpdesk/tickets/' + getTicketId() + '/conversations/note.json', data)
      var retVal = http.post('/api/v2/tickets/' + this.getTicketId() + '/notes', data)

      if (retVal) {
        this.reloadTicket()
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
    replyTicket (data) {

      validateHelpdeskObject(data)

      var retVal = http.post('/api/v2/tickets/' + this.getTicketId() + '/reply', data)

      if (retVal) {
        this.reloadTicket()
        return true
      }

      return false
    }

    /**
    *
    *
    * @tested
    */
    getTicketPriority () { return this.ticketObj.priority }
    setTicketPriority (priority) {
      // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
      var retVal = http.put('/api/v2/tickets/' + this.getTicketId(), {
        priority: priority,
      })

      if (retVal) {
        this.reloadTicket()
        return this
      }

      throw Error('set priority fail')
    }

    /**
    *
    *
    * @tested
    */
    getTicketStatus () { return this.ticketObj.status }
    setTicketStatus (status) {
      // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
      var retVal = http.put('/api/v2/tickets/' + this.getTicketId(), {
        status: status,
      })

      if (retVal) {
        this.reloadTicket()
        return this
      }

      throw Error('set status fail')
    }

    getTicketGroup () { return this.ticketObj.group_id }
    setTicketGroup (groupId) {
      var retVal = http.put('/api/v2/tickets/' + this.getTicketId(), {
        group_id: groupId,
      })

      if (retVal) {
        this.reloadTicket()
        return this
      }

      throw Error('set group fail')
    }

    setTicketCustomField (customFields) {
      // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
      var retVal = http.put('/api/v2/tickets/' + this.getTicketId(), {
        custom_field: customFields,
      })

      if (retVal) {
        this.reloadTicket()
        return this
      }

      throw Error('set status fail')
    }

    setTicketTag (tags) {

      throw Error('not implemented yet')

      // var ticketTags = ticketObj.tags

      // "tags":[
      //   {"name": "tag1"},
      //   {"name": "tag2"}
      // ]

      // v1: var retVal = http.put('/helpdesk/tickets/' + getTicketId() + '.json', {
      // var retVal = http.put('/api/v2/tickets/' + getTicketId(), {
      //   helpdesk: {
      //     tags: ticketTags
      //   }
      // })

      // if (retVal) {
      //   reloadTicket(getTicketId())
      //   return this
      // }

      // throw Error('set tags fail')
    }

  }

}

export { getTicket }
