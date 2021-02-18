'use strict'

//This file contains then/promise specific extensions to the core promise API

var Promise = require('./core.js')
var asap = require('asap')


module.exports = Promise

/* Static Functions */

function ValuePromise(value) {
  this.then = function (onFulfilled) {
    if (typeof onFulfilled !== 'function') {
      return this
    }
    return new Promise(function(resolve, reject) {
      asap(function() {
        try {
          resolve(onFulfilled(value))
        } catch (ex) {
          reject(ex)
        }
      })
    })
  }
}

ValuePromise.prototype = Promise.prototype

var TRUE = new ValuePromise(true)
var FALSE = new ValuePromise(false)
var NULL = new ValuePromise(null)
var UNDEFINED = new ValuePromise(undefined)
var ZERO = new ValuePromise(0)
var EMPTYSTRING = new ValuePromise('')

Promise.resolve = function (value) {
  if (value instanceof Promise) {
    return value
  }

  if (value === null) {
    return NULL
  }

  if (value === undefined) {
    return UNDEFINED
  }

  if (value === true) {
    return TRUE
  }

  if (value === false) {
    return FALSE
  }

  if (value === 0) {
    return ZERO
  }

  if (value === '') {
    return EMPTYSTRING
  }

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then
      if (typeof then === 'function') {
        return new Promise(then.bind(value))
      }
    } catch (ex) {
      return new Promise(function(resolve, reject){
        reject(ex)
      })
    }
  }

  return new ValuePromise(value)
}

Promise.all = function (arr) {
  if (arguments.length !== 1 || !Array.isArray(arr)) {
    return variadicAll.apply(this, arguments)
  }

  var args = Array.prototype.slice.call(arr)

  return new Promise(function(resolve, reject) {
    if (args.length === 0) {
      return resolve([])
    }
    var remaining = args.length

    function res(i, val) {
      if (val && (typeof val === 'object' || typeof val === 'function')) {
        var then = val.then
        if (typeof then === 'function') {
          then.call(val, function(val) { res(i, val) }, reject)
          return
        }
      }
      args[i] = val
      if (--remaining === 0) {
        resolve(args)
      }
    }
    for (let i = 0; i < args.length; i++) {
      res(i, args[i])
    }
  })
}

function variadicAll() {
  var err = new Error('Promise.all should be called with a single array, calling it with multiple arguments is deprecated')
  err.name = 'Warning'
  console.warn(err.stack)

  return Promise.all(Array.prototype.slice.call(arguments))
}


Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value)
  })
}

Promise.race = function(values) {
  return new Promise(function(resolve, reject) {
    values.map(function(value){
      Promise.resolve(value).then(resolve, reject)
    })
  })
}

/* Prototype Methods */

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected)
}