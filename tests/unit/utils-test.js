import { resolve } from 'rsvp';
import EmberObject from '@ember/object';
import { utils } from 'ember-fsm-bridge';
import { module, test } from 'qunit';

const {
  isThenable,
  capitalCamelize,
  toArray,
  withPromise,
  ownPropertiesOf,
  isObject,
  getFirst
} = utils;

module('Unit: ember-fsm/-utils - isThenable', function() {
  test('returns true for plain objects where .then is a function', function(assert) {
    assert.ok(isThenable({ then() {} }));
  });

  test('returns true for Ember objects where .then is a function', function(assert) {
    let eobj = EmberObject.create({ then() {} });
    assert.ok(isThenable(eobj));
  });

  test('returns false for plain objects that don\'t have a .then function', function(assert) {
    assert.expect(2);

    let eobj = EmberObject.create({ then: true });
    let obj  = { then: true };
    assert.notOk(isThenable(eobj));
    assert.notOk(isThenable(obj));
  });

  test('returns false for everything else', function(assert) {
    assert.expect(7);

    let tests = [
      null,
      undefined,
      false,
      'string',
      1234,
      [],
      {}
    ];

    tests.forEach((test) => {
      assert.notOk(isThenable(test));
    });
  });
});

module('Unit: ember-fsm/-utils - capitalCamelize', function() {
  test('camelizes strings and then capitalizes them', function(assert) {
    assert.expect(4);

    let expectations = {
      'hello.world':   'HelloWorld',
      'zzt remixes':   'ZztRemixes',
      'big-funThings': 'BigFunThings',
      'is_not-True':   'IsNotTrue'
    };

    for (let input in expectations) {
      let expectation = expectations[input];
      assert.strictEqual(capitalCamelize(input), expectation);
    }
  });
});

module('Unit: ember-fsm/-utils - toArray', function() {
  test('wraps stuff into an array', function(assert) {
    assert.deepEqual(toArray('stuff'), ['stuff']);
  });

  test('doesn\'t wrap arrays', function(assert) {
    let stuff = ['i', 'am', 'ary'];
    assert.strictEqual(toArray(stuff), stuff);
  });
});

module('Unit: ember-fsm/-utils - withPromise', function() {
  test('given a block that yields a thenable object', function(assert) {
    assert.expect(2);

    let yieldedPromise;
    let done = assert.async();

    let result = withPromise(() => {
      return yieldedPromise = resolve('sup?');
    });

    result.then((value) => {
      assert.strictEqual(result, yieldedPromise, 'returns original thenable');
      assert.strictEqual(value, 'sup?', 'resolves to it\'s intended value');
      done();
    });
  });

  test('given a block that yields a non-thenable value', function(assert) {
    assert.expect(1);

    let yieldedValue;
    let done = assert.async();

    let result = withPromise(() => {
      return yieldedValue = { hey: 'carsten' };
    });

    result.then((value) => {
      assert.strictEqual(value, yieldedValue, 'returns a promise that resolves to the yielded value');
      done();
    });
  });

  test('given a block that throws an error', function(assert) {
    assert.expect(1);

    let yieldedException;
    let done = assert.async();

    let result = withPromise(function() {
      throw (yieldedException = new Error());
    });

    result.catch(function(error) {
      assert.strictEqual(error, yieldedException, 'returns a promise that rejects with the exception');
      done();
    });
  });
});

module('Unit: ember-fsm/-utils - ownPropertiesOf', function() {
  test('returns an array of properties belonging to object', function(assert) {
    assert.expect(2);

    let ary = ownPropertiesOf({ one: 1, two: 2, three: 3 });
    assert.strictEqual(ary.length, 3);
    assert.deepEqual(ary, ['one', 'two', 'three']);
  });

  test('does not return properties belonging to prototype', function(assert) {
    assert.expect(2);

    let obj = EmberObject.extend({ yo: 'hi' }).create({ cool: true });
    let ary = ownPropertiesOf(obj);

    assert.strictEqual(ary.length, 1);
    assert.deepEqual(ary, ['cool']);
  });

  test('does not work on arrays', function(assert) {
    assert.throws(function() {
      ownPropertiesOf(['oops', 'i', 'fail']);
    }, TypeError);
  });

  test('does not return properties that are undefined', function(assert) {
    assert.expect(2);

    let ary = ownPropertiesOf({ one: 1, t00: undefined, thr33: undefined });
    assert.strictEqual(ary.length, 1);
    assert.deepEqual(ary, ['one']);
  });
});

module('Unit: ember-fsm/-utils - isObject', function() {
  test('returns true for objects', function(assert) {
    assert.expect(3);

    assert.ok(isObject(EmberObject.create()));
    assert.ok(isObject({}));
    assert.ok(isObject(EmberObject.extend()));
  });

  test('returns false for non-objects', function(assert) {
    assert.expect(3);

    assert.notOk(isObject(null));
    assert.notOk(isObject([]));
    assert.notOk(isObject(undefined));
  });
});

module('Unit: ember-fsm/-utils - getFirst', function() {
  test('returns the first property of object that isn\'t undefined', function(assert) {
    let obj = { one: 1, two: 2 };
    assert.strictEqual(getFirst(obj, 'two'), 2);
  });
});

module('Unit: ember-fsm/-utils - bind', function() {
  test('changes the function context to the supplied target', function(assert) {
    assert.expect(2);

    let x = { y: 1 };
    let fn = utils.bind(x, function() {
      this.y = 2;
    });

    assert.strictEqual(x.y, 1);

    fn();

    assert.strictEqual(x.y, 2);
  });
});

module('Unit: ember-fsm/-utils - contains', function() {
  test('returns true if the array contains the provided element', function(assert) {
    assert.expect(2);

    let a = ['a', 'b', 'c'];
    assert.ok(utils.contains(a, 'b'));
    assert.ok(utils.contains(a, 'c'));
  });

  test('returns false if the array does not contain the provided element', function(assert) {
    assert.expect(3);

    let a = ['a', 'b', 'c'];
    assert.notOk(utils.contains(a, 'x'));
    assert.notOk(utils.contains(a, true));
    assert.notOk(utils.contains(a, undefined));
  });
});
