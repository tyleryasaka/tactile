const _ = require('underscore')
const {
  validityResult
} = require('./utils')

const variableTypes = [
  'function',
  'domain',
  'value'
]

const primitiveValidators = {
  'string-literal': new RegExp('.*'),
  'bool-literal': new RegExp('^(true|false)$'),
  'integer-literal': new RegExp('^\\d+$'),
  'domain-literal': new RegExp('^(string|integer|bool|function)$')
}

const multiTypes = {
  value: ['application', 'ifelse', 'function', 'integer-literal', 'string-literal', 'bool-literal'],
  domain: ['domain-literal', 'function-signature']
}

const objValidators = {
  program: [
    {
      key: 'functions',
      type: 'function-definition',
      list: true
    }
  ],
  'function-definition': [
    {
      key: 'id',
      type: 'string-literal',
      list: false
    },
    {
      key: 'function',
      type: 'function',
      list: false
    }
  ],
  function: [
    {
      key: 'name',
      type: 'string-literal',
      list: false
    },
    {
      key: 'description',
      type: 'string-literal',
      list: false
    },
    {
      key: 'domainParams',
      type: 'domainParam',
      list: true
    },
    {
      key: 'valueParams',
      type: 'valueParam',
      list: true
    },
    {
      key: 'domain',
      type: 'domain',
      list: false
    },
    {
      key: 'body',
      type: 'value',
      list: false
    }
  ],
  domainParam: [
    {
      key: 'name',
      type: 'string-literal',
      list: false
    },
    {
      key: 'description',
      type: 'string-literal',
      list: false
    }
  ],
  valueParam: [
    {
      key: 'name',
      type: 'string-literal',
      list: false
    },
    {
      key: 'description',
      type: 'string-literal',
      list: false
    },
    {
      key: 'domain',
      type: 'domain',
      list: false
    }
  ],
  'function-signature': [
    {
      key: 'domain',
      type: 'domain',
      list: false
    },
    {
      key: 'domainParamsCount',
      type: 'integer-literal',
      list: false
    },
    {
      key: 'valueParamDomains',
      type: 'domain',
      list: true
    }
  ],
  application: [
    {
      key: 'function',
      type: 'string-literal',
      list: false
    },
    {
      key: 'valueArgs',
      type: 'value',
      list: true
    },
    {
      key: 'domainArgs',
      type: 'domain',
      list: true
    }
  ],
  ifelse: [
    {
      key: 'domain',
      type: 'domain',
      list: false
    },
    {
      key: 'condition',
      type: 'value',
      list: false
    },
    {
      key: 'if',
      type: 'value',
      list: false
    },
    {
      key: 'else',
      type: 'value',
      list: false
    }
  ]
}

function validateSyntax (program) {
  return withPath(validateToken(program, 'program'), ['program'])
}

function validateToken (token, tokenType, variableApplied = false) {
  const keysWithType = objValidators[tokenType]
  const regex = primitiveValidators[tokenType]
  const allowedTypes = multiTypes[tokenType]
  if (regex !== undefined) {
    return validatePrimitive(regex, token)
  } else if (!variableApplied && _.includes(variableTypes, tokenType)) {
    return validateVariable(token, tokenType)
  } else if (allowedTypes !== undefined) {
    return validateMultitype(allowedTypes, token)
  } else {
    return validateObject(keysWithType, token)
  }
}

function validatePrimitive (regex, value) {
  return validityResult(regex.test(value), 'invalid-primitive')
}

function validateVariable (token, tokenType) {
  return chainIfValid([
    () => hasKeys(token, ['variable', 'child']),
    () => {
      if (token.variable === 'true') {
        return validateToken(token.child, 'integer-literal')
      } else {
        return validateToken(token.child, tokenType, true)
      }
    }
  ])
}

function validateObject (keysWithType, token) {
  return chainIfValid([
    () => hasKeys(token, _.map(keysWithType, kWT => kWT.key)),
    () => {
      return validateEach(keysWithType, (keyWithType) => {
        return validateProperty(keyWithType.list, keyWithType.type, token, keyWithType.key)
      })
    }
  ])
}

function validateMultitype (allowedTypes, token) {
  return chainIfValid([
    () => hasKeys(token, ['childType', 'child']),
    () => validityResult(_.contains(allowedTypes, token['childType']), 'type-not-allowed'),
    () => validateProperty(false, token['childType'], token, 'child')
  ])
}

function validateProperty (isList, propertyType, token, key) {
  const property = token[key]
  return (
    isList
      ? chainIfValid([
        () => validityResult(Array.isArray(property), 'invalid-list'),
        () => {
          return property.length > 0
            ? validateEach(property, (item, i) => {
              return withPath(validateToken(item, propertyType), [key, String(i)])
            })
            : { isValid: true, errorCode: '', errorPath: [] }
        }
      ])
      : withPath(validateToken(property, propertyType), [key])
  )
}

function validateEach (list, fn) {
  const chainedCalls = list.map((item, i) => {
    return () => fn(item, i)
  })
  return chainIfValid(chainedCalls)
}

function withPath (result, path) {
  return result.isValid
    ? result
    : {
      isValid: false,
      errorCode: result.errorCode,
      errorPath: _.union(path, result.errorPath)
    }
}

function chainIfValid (fnList) {
  const result = _.first(fnList)()
  if (fnList.length > 1) {
    return result.isValid ? chainIfValid(_.rest(fnList)) : result
  } else {
    return result
  }
}

function hasAllExpectedKeys (expectedKeys, actualKeys) {
  return validityResult(_.difference(expectedKeys, actualKeys).length === 0, 'missing-key')
}

function hasNoExtraKeys (expectedKeys, actualKeys) {
  return validityResult(_.difference(actualKeys, expectedKeys).length === 0, 'extra-key')
}

function hasKeys (obj, expectedKeys) {
  const actualKeys = _.keys(obj)
  return chainIfValid([
    () => hasAllExpectedKeys(expectedKeys, actualKeys),
    () => hasNoExtraKeys(expectedKeys, actualKeys)
  ])
}

module.exports = validateSyntax
