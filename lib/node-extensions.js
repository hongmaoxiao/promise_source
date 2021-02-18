'use strict'

//This file contains then/promise specific extensions to the core promise API

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise

/* Static Functions */

Promise.denodeify = function(fn, argumentCount) {
  argumentCount = argumentCount || Infinity
  return function () {
    var self = this
    var args = Array.prototype.slice(arguments)

    return new Promise(function(resolve, reject) {
      while (args.length && args.length > argumentCount) {
        args.pop()
      }
      args.push(function(err, res) {
        if (err) {
          reject(err)
        } else {
          resolve(res)
        }
      })
      var res = fn.apply(self, args)
      if (res && res.then) {
        resolve(res)
      }
    })
  }
}

Promise.nodeify = function(fn) {
  return function () {
    var args = Array.prototype.slice(arguments)
    var callback = typeof args[args.length - 1] === 'function' ? args.pop() : null
    var ctx = this
    try {
      return fn.apply(this, arguments).nodeify(callback, ctx)
    } catch (ex) {
      if (callback == null || typeof callback === 'undefined') {
        return new Promise(function(resolve, reject) {
          reject(ex)
        })
      } else {
        asap(function() {
          callback.call(ctx, ex)
        })
      }
    }
  }
}

Promise.prototype.nodeify = function (callback, ctx) {
  if (typeof callback !== 'function') {
    return this
  }

  this.then(function(value) {
    asap(function() {
      callback.call(ctx, null, value)
    })
  }, function(err) {
    asap(function() {
      callback.call(ctx, err)
    })
  })
}