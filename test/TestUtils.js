var Immutable = require("../seamless-immutable.js");
var JSC       = require("jscheck");
var assert    = require("chai").assert;

var timeoutMs = 3000;

function isEqual(expected, actual) {
  if ((expected instanceof Array) && (actual instanceof Array)) {
    if (expected.length !== actual.length) {
      return false;
    }

    for (var index in expected) {
      if (!isEqual(expected[index], actual[index])) {
        return false;
      }
    }

    return true;
  } else if ((typeof expected === "object") && (typeof actual === "object")) {
    if (expected === null || actual === null) {
      return expected === actual;
    }

    for (var key in expected) {
      if (!isEqual(expected[key], actual[key])) {
        return false;
      }
    }

    for (var key in actual) {
      if (!isEqual(actual[key], expected[key])) {
        return false;
      }
    }

    return true;
  } else {
    return (expected === actual) || (isNaN(expected) && isNaN(actual));
  }
}

function throwsException(exceptionType, logic) {
  try {
    logic()
  } catch (err) {
    return err instanceof exceptionType;
  }

  return false;
}

function identityFunction(obj){ return obj; }

function returnsImmutable(methodName, immutableArray, mutableArray, args) {
  var mutableResult   =   mutableArray[methodName].apply(mutableArray,   args);
  var immutableResult = immutableArray[methodName].apply(immutableArray, args);

  return isEqual(immutableResult, Immutable(mutableResult));
}

function ImmutableArraySpecifier(JSC) {
  var args = Array.prototype.slice.call(arguments);

  return function generator() {
    var mutable = JSC.array.apply(JSC.array, args)();

    return Immutable(mutable);
  }
}

function check(runs, generators, runTest) {
  var completed;

  if (typeof generators === "function") {
    generators = [generators];
  } else if (!(generators instanceof Array)) {
    throw new TypeError("Not a valid generator list: " + JSON.stringify(generators))
  }

  for (completed=0; completed < runs; completed++) {
    var generated = generators.map(function(generator) { return generator() });

    runTest.apply(runTest, generated);
  }

  assert.strictEqual(completed, runs,
    "The expected " + runs + " runs were not completed.");

  return completed;
}

function checkImmutableMutable(runs, specifiers) {
  return function(callback, extraSpecifiers) {
    extraSpecifiers = extraSpecifiers || [];

  check(runs, specifiers.concat(extraSpecifiers), function(mutable) {
      var immutable = Immutable(mutable);
      var args      = Array.prototype.slice.call(arguments);

      callback.apply(callback, [immutable].concat(args));
    });
  };
}

module.exports = {
  isEqual:                 isEqual,
  identityFunction:        identityFunction,
  returnsImmutable:        returnsImmutable,
  throwsException:         throwsException,
  ImmutableArraySpecifier: ImmutableArraySpecifier,
  check:                   check,
  checkImmutableMutable:   checkImmutableMutable
}