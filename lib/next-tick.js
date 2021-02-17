'use strict'

var nextTick


if (typeof setImmediate === 'function') { // IE >= 10 & node.js >= 0.10
  nextTick = function(fn){ setImmediate(fn) }
} else if (typeof process !== 'undefined' && process && typeof process.nextTick === 'function') { // node.js before 0.10
  nextTick = function(fn){ process.nextTick(fn) }
} else {
  nextTick = function(fn){ setTimeout(fn, 0) }
}

module.exports = nextTick