/*
** AmoCRM API endpoints list
*/

const amo_endpoints = {
  Contacts: "v4/contacts",
  Calls: "v4/calls",
  LeadNotes: "v4/leads/notes",
  ContactNotes: "v4/contacts/notes",
  CustomerNotes: "v4/customers/notes",
}



for (const [key, value] of Object.entries(amo_endpoints)) {
  amo_endpoints[key] = "/api/" + value
}

amo_endpoints.Domain = "https://" + location.hostname

export default amo_endpoints
