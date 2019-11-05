module.exports = function () {
  return {
    '$schema': 'http://json-schema.org/schema#',
    '$id': 'clarity/hidden-identifier',
    'type': 'string',
    'additionalProperties': false,
    'pattern': '^[A-Za-z0-9.]+$'
  }
}