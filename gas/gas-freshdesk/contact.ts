/***************************************************************************
*
* Class Contact
* -------------
*/
import { Http } from './http'

let http: Http

class Contact {

  contactObj: any = {}

  static findAll (options: { email: string }) {

    var email = options.email

    var data = http.get('/api/v2/contacts?email=' + encodeURIComponent(email))

    if (!data || !data.length) return []

    const contactList = data.map(function (d: any) {
      return new Contact(d.id)
    })

    return contactList
  }

  constructor (options: number | object) {
    if (typeof options === 'number') {
      /**
      * 1. existing contact, get it by ID
      */
      const id = options
      this.reloadContact(id)

    } else if ((typeof options) === 'object') { // { x: y } options
      /**
      * 2. new contact. create it.
      */
      // v1: contactObj = http.post('/contacts.json', options)
      this.contactObj = http.post('/api/v2/contacts', options)

    } else {
      // 3. error.
      throw Error('options must be integer or options')
    }

  }

  getRawObj () { return this.contactObj }

  getContactId () {
    if (this.contactObj && this.contactObj.id) {
      return this.contactObj.id
    }

    return null
  }

  deleteContact () {
    // v1: if ('deleted'==http.del('/contacts/' + getContactId() + '.json')) {
    if (http.del('/api/v2/contacts/' + this.getContactId()) === 'deleted') {
      this.reloadContact() // refresh
      return true
    }
    return false
  }

  /**
  *
  * Reload Contact Object Raw Data
  *
  */
  reloadContact (id?: number) {

    if (typeof id === 'undefined') id = this.getContactId()

    // v1: contactObj = http.get('/contacts/' + id + '.json')
    this.contactObj = http.get('/api/v2/contacts/' + id)

    return this
  }

  /**
  *
  *
  * @testing
  */
  getContactName () {
    return this.contactObj.name
  }

  setContactName (name: string) {
    // v1: var retVal = http.put('/contacts/' + getContactId() + '.json', {
    var retVal = http.put('/api/v2/contacts/' + this.getContactId(), {
      name: name,
    })

    if (retVal) {
      this.reloadContact()
      return this
    }

    throw Error('set name fail')
  }

  getContactEmail () {
    return this.contactObj.email
  }

  /**
  *
  *
  * @testing
  */
  getContactTitle () { return this.contactObj.job_title }
  setContactTitle (title: string) {
    // v1: var retVal = http.put('/contacts/' + getTicketId() + '.json', {
    var retVal = http.put('/api/v2/contacts/' + this.getContactId(), {
      user: {
        job_title: title,
      },
    })

    if (retVal) {
      this.reloadContact()
      return this
    }

    throw Error('set status fail')
  }

}

export { Contact }
