const MAX_EXECUTION_TIME = 6 * 60 * 1000 // 6 mins - https://developers.google.com/apps-script/guides/services/quotas#current_quotas
const MAX_LIFE_TIME      = MAX_EXECUTION_TIME / 6

const START_TIME = (new Date()).getTime()

class Gas {

  static getLifeTime () {
    return (new Date()).getTime() - START_TIME
  }

  static getLifeSeconds () { return Math.floor(this.getLifeTime() / 1000) }
  static isYourTime () { return this.getLifeTime() > MAX_LIFE_TIME }

}

export { Gas }
