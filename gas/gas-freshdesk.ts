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
import { Http } from './http'

class Freshdesk {

  http: Http

  constructor (
    public url: string,
    public key: string,
  ) {
    this.http = new Http(url, key)

    /**
     * validateAuth: try to listTickets
     * if url & key is not right
     * exception will be thrown
     */
    this.validateAuth()

  }

  /**
   *
   * make a http call to api, in order to confirm the auth token is right.
   * @tested
   */
  validateAuth () {
    // v1: return http.get('/helpdesk/tickets/filter/all_tickets?format=json')
    return this.http.get('/api/v2/tickets?per_page=1')
  }

}

export { Freshdesk }
