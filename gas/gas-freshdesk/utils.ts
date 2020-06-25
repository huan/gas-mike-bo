/**
 *
 * return email if valid
 * throw exception if NOT valid
 *
 */
function validateEmail (email?: string): string {
  if (!email) {
    throw new Error('email is empty!')
  }

  var RE = /<?[a-z0-9\-_.]+@[a-z0-9\-_]+\.[a-z0-9\-_.]+>?$/i

  if (RE.test(email)) return email

  throw Error('invalid email: [' + email + ']')
}

function validateInteger (num: any) {
  if (num % 1 === 0) return num
  else throw Error('invalid integer: [' + num + ']')
}

/**
 * freshdesk api v2 has better error checking for us.
 */
function validateHelpdeskObject (obj: any) {
  if (!obj || (typeof obj !== 'object')) throw Error('invalid helpdesk object: it is not object.')

  if (obj.email) validateEmail(obj.email)

  // unknown treat as ok
  return true
}

export {
  validateEmail,
  validateInteger,
  validateHelpdeskObject,
}
