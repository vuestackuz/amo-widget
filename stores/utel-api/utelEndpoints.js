/*
** UTeL API endpoints list
*/

const utel_endpoints = {
  SipUserInfo: "info",
  Originate: "originate"
}

for (const [key, value] of Object.entries(utel_endpoints)) {
  utel_endpoints[key] = "/api/v1/integration/amocrm/widget/" + value
}

export default utel_endpoints
