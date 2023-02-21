import { typeOf } from '@ember/utils';
import { Definition, Machine, Transition, Stateful, reject } from 'ember-fsm-bridge';
import { module, test } from 'qunit';

module('Unit: ember-fsm/index', function() {

  test('imports Definition', function(assert) {
    assert.strictEqual(typeOf(Definition), 'function');
  });

  test('imports Machine', function(assert) {
    assert.strictEqual(typeOf(Machine), 'class');
  });

  test('imports Transition', function(assert) {
    assert.strictEqual(typeOf(Transition), 'class');
  });

  test('imports Stateful', function(assert) {
    assert.strictEqual(typeOf(Stateful), 'object');
  });

  test('imports reject', function(assert) {
    assert.strictEqual(typeOf(reject), 'function');
  });
});
