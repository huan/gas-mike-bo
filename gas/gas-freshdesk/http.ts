/***********************************************************************
 *
 * Class Http
 * ----------
 * Backend Class for Freshdesk Rest API
 *
 * options.key
 * options.type
 *
 */

class Http {

  authHeader: {
    Authorization: string
  }

  constructor (
    public url: string,
    public key: string,
  ) {
    this.authHeader = {
      'Authorization': 'Basic ' + Utilities.base64Encode(key + ':X'),
    }
  }

  get (path: string) {
    return this.httpBackend('get', path)
  }

  put (path: string, data) {
    return this.httpBackend('put', path, data)
  }

  post (path: string, data) {
    return this.httpBackend('post', path, data)
  }

  del (path: string) {
    return this.httpBackend('delete', path)
  }

  /**
   *
   * HTTP Backend Engine
   *
   */
  httpBackend (
    method: 'get' | 'put' | 'post' | 'delete',
    path: string,
    data?: any,
  ) {

    var contentType, payload

    if (method === 'post' && this.hasAttachment(data)) {

      var BOUNDARY = '-----CUTHEREelH7faHNSXWNi72OTh08zH29D28Zhr3Rif3oupOaDrj'
      var multipartArray = this.makeMultipartArray(data)

      // log(JSON.stringify(multipartArray))

      contentType = 'multipart/form-data; boundary=' + BOUNDARY
      payload = this.makeMultipartBody(multipartArray, BOUNDARY)

    } else if (!data || data instanceof Object) {

      /**
      *
      * When we pass a object as payload to UrlFetchApp.fetch, it will treat object as a key=value form-urlencoded type.
      *
      * If we want to post JSON object via fetch, we must:
      *  1. specify contentType to 'application/json'
      *  2. payload should already be JSON.stringify(ed)
      *
      */
      contentType = 'application/json'
      payload = JSON.stringify(data)

    } else {

      contentType = 'application/x-www-form-urlencoded'
      payload = data

    }

    var options = {
      headers: this.authHeader,
      method: method,
      muteHttpExceptions: true,
    }

    switch (method.toLowerCase()) {
      case 'post':
      case 'put':
        options.contentType = contentType
        options.payload = payload
        break

      default:
      case 'get':
      case 'delete':
        break

    }

    if (/^http/.test(path)) {
      var endpoint = path
    } else {
      endpoint = URL + path
    }

    /**
    *
    * UrlFetch fetch API EndPoint
    *
    */

    let TTL = 3
    let response
    let retCode = ''

    while (!retCode && TTL--) {
      try {
        response = UrlFetchApp.fetch(endpoint, options)
        retCode = String(response.getResponseCode()) || ''
      } catch (e) {
        log(log.DEBUG, 'UrlFetchApp.fetch exception(ttl:%s): %s, %s', TTL, e.name, e.message)
        Utilities.sleep(50) // sleep 50 ms
      }
      // Logger.log('ttl:' + TTL + ', retCode:' + retCode)
    }

    switch (true) {
      case /^2/.test(retCode):
        // It's ok with 2XX
        break

      case /^3/.test(retCode):
        // TBD: OK? NOT OK???
        break

      case /^4/.test(retCode):
      case /^5/.test(retCode):
        /**
        *
        * Get Detail Error Response from Freshdesk API v2
        * http://developer.freshdesk.com/api/#error
        *
        */
        var apiErrorMsg

        try {
          var respObj = JSON.parse(response.getContentText())

          var description = respObj.description
          var errors = respObj.errors

          var errorMsg

          if (errors && errors instanceof Array) {
            errorMsg = errors.map(function (e) {
              return Utilities.formatString('code[%s], field[%s], message[%s]',
                e.code || '',
                e.field || '',
                e.message || '',
              )
            }).reduce(function (v1, v2) {
              return v1 + '; ' + v2
            })

          } else if (respObj.code) {
            errorMsg = Utilities.formatString('code[%s], field[%s], message[%s]',
              respObj.code || '',
              respObj.field || '',
              respObj.message || '',
            )
          }

          // clean options
          if (options.payload) {
            options.payload = options.payload
              ? JSON.parse(options.payload)
              : {}

            if (options.payload.body) options.payload.body = '...STRIPED...'
            if (options.payload.description) options.payload.description = '...STRIPED...'
          }
          options = JSON.stringify(options)

          apiErrorMsg = Utilities
            .formatString('Freshdesk API v2 failed when calling endpoint[%s], options[%s], description[%s] with error: (%s)',
              endpoint,
              options,
              description || '',
              errorMsg || '',
            )
        } catch (e) {
          Logger.log(e.name + ',' + e.message + ',' + e.stack)
        }

        if (apiErrorMsg) {
          throw Error(apiErrorMsg)
        }

        throw Error('http call failed with http code:' + response.getResponseCode())

      default:
        var errMsg = [
          'endpoint: ' + endpoint,
          'options: ' + JSON.stringify(options),
          response
            ? response.getContentText().substring(0, 1000)
            : '(undefined)',
          'api call failed with http code:' + (response ? response.getResponseCode() : '(undefined)'),
        ].join(', ')

        throw Error(errMsg)
    }

    var retContent = response.getContentText()

    /**
    * Object in object out
    * String in string out
    */
    var retObj

    switch (true) {
      case /x-www-form-urlencoded/.test(contentType):
        try {
          retObj = JSON.parse(retContent)
        } catch (e) {
          // it's ok here, just let ret be string.
          retObj = retContent
        }

        break

      default:
      case /multipart/.test(contentType):
      case /json/.test(contentType):
        try {
          retObj = JSON.parse(retContent)
        } catch (e) {
          /**
          * something went wrong here!
          * because we need: Object in object out
          */
          retObj = {
            error: e.message,
            string: retContent,
          }
        }
        break
    }

    // Freshdesk API will set `require_login` if login failed
    if (retObj && retObj.require_login) throw Error('auth failed to url ' + this.url + ' with key ' + this.key)

    return retObj

  }

  /**
  *
  * @param object data
  * @return string a multipart body
  *
  * concat attachments for array [attachments][]
  *
  * @testing
  */
  makeMultipartBody (multipartArray, boundary) {

    var body = Utilities.newBlob('').getBytes()

    for (var i in multipartArray) {
      var [k, v] = multipartArray[i]

      // log('multipartArray[' + k + ']')

      if (v.toString() === 'Blob'
          || v.toString() === 'GmailAttachment'
      ) {

        // log(v.toString())
        // log(v)
        // log(typeof v)

        // Object.keys(v).forEach(function (k) {
        //   log('v[' + k + ']')
        // })

        // attachment
        body = body.concat(
          Utilities.newBlob(
            '--' + boundary + '\r\n'
            + 'Content-Disposition: form-data; name="' + k + '"; filename="' + v.getName() + '"\r\n'
            + 'Content-Type: ' + v.getContentType() + '\r\n\r\n'
          ).getBytes()
        )

        body = body
          .concat(v.getBytes())
          .concat(Utilities.newBlob('\r\n').getBytes())

      } else {

        // string
        body = body.concat(
          Utilities.newBlob(
            '--' + boundary + '\r\n'
            + 'Content-Disposition: form-data; name="' + k + '"\r\n\r\n'
            + v + '\r\n'
          ).getBytes()
        )

      }

    }

    body = body.concat(Utilities.newBlob('--' + boundary + '--\r\n').getBytes())

    return body

  }

  /**
  *
  * @param object obj
  *
  * @return Array [ [k,v], ... ]
  * @tested
  */
  makeMultipartArray (obj) {

    let multipartArray = [] as any[]

    for (var k in obj) {
      recursion(k, obj[k])
    }

    const that = this

    return multipartArray

    function recursion (key, value) {
      if ((typeof value) === 'object' && !that.isAttachment(value)) {
        for (var k in value) {
          if (value instanceof Array) {

            // recursion for Array
            recursion(key + '[]', value[k])

          } else {

            // recursion for Object
            recursion(key + '[' + k + ']', value[k])

          }
        }
      } else {

        // Push result to Array
        multipartArray.push([key, value])

      }
    }

  }

  /**
  *
  * Walk through a object, return true if there has any key named "attachments"
  * @tested
  */
  hasAttachment (obj) {

    if ((typeof obj) !== 'object') return false

    var hasAtt = false

    var keys = Object.keys(obj)

    for (let i = 0; i < keys.length; i++) {
      var key = keys[i]
      if (key === 'attachments' || this.hasAttachment(obj[key])) {
        hasAtt = true
        break
      }
    }

    return hasAtt
  }

  isAttachment (v) {
    // 20160115 a array which include 1 Blob, toString() will also return a 'Blob'
    if (v instanceof Array) return false

    if (v.toString() === 'Blob' || v.toString() === 'GmailAttachment') {
      return true
    }

    return false
  }

}

export { Http }
