/* globals describe, it */

const fs = require('fs')
const assert = require('assert')

const valid1 = fs.readFileSync('./test/stubs/program.json', 'utf8')
const valid2 = fs.readFileSync('./test/stubs/valid/opt.json', 'utf8')
const mathProgram = fs.readFileSync('./test/stubs/valid/math.json', 'utf8')
const libraryDefProgram = fs.readFileSync('./test/stubs/valid/library-def.json', 'utf8')
const libraryCallProgram = fs.readFileSync('./test/stubs/valid/library-call.json', 'utf8')
const validate = require('../src/validate')

describe('validate', function () {
  it('should return an error for invalid input', function () {
    // programJSON is a raw string (not parsed as JSON object), thus invalid
    const result = validate(valid1)
    assert.strictEqual(result.errorCode, 'invalid-input')
    assert.strictEqual(result.isValid, false)
  })

  it('should validate a valid program without errors', function () {
    const result = validate(JSON.parse(valid1))
    assert.strictEqual(result.errorCode, '')
    assert.ok(result.isValid)
    const result2 = validate(JSON.parse(valid2))
    assert.strictEqual(result2.errorCode, '')
    assert.ok(result.isValid)
  })

  it('should validate a program that calls core function', function () {
    const result = validate(JSON.parse(mathProgram))
    assert.strictEqual(result.errorCode, '')
    assert.ok(result.isValid)
  })

  it('should validate a program that calls library function', function () {
    const result = validate(JSON.parse(libraryCallProgram), { mylib: JSON.parse(libraryDefProgram) })
    assert.strictEqual(result.errorCode, '')
    assert.ok(result.isValid)
  })
})
