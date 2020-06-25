
/***************************************************************************
 *
 * Class Agent
 * -----------
 */
import { Http } from './http'

const http: Http

class Agent {

  agentObj: any = {}

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
  static findAll (options: { email: string }) {

    var email = options.email

    var data = http.get('/api/v2/agents?email=' + encodeURIComponent(email))

    if (!data || !data.length) return []

    var agents = data.map(function (d: any) {
      return new Agent(d.id)
    })

    return agents
  }


  constructor (id: number) {
    /**
    * 1. existing agent, get it by ID
    */

    // load #id to agentObj
    this.reloadAgent(id)

  }

  /**
   *
   * Reload Agent Object Raw Data
   *
   */
  reloadAgent (id?: number) {
    if (typeof id === 'undefined') {
      id = this.getAgentId()
    }

    // v1: agentObj = http.get('/agents/' + id + '.json')
    this.agentObj = http.get('/api/v2/agents/' + id)

    return this
  }

  getAgentId () {
    if (this.agentObj && this.agentObj.id) {
      return this.agentObj.id
    }

    return null
  }

  getAgentName () {
    return this.agentObj.contact.name
  }

  getRawObj () { return this.agentObj }

}

export { Agent }
