import { next } from '@ember/runloop';
import EmberObject from '@ember/object';
import { Stateful } from 'ember-fsm-bridge';
import { module, test } from 'qunit';

module('Unit: ember-fsm/-stateful', function(hooks) {
  hooks.beforeEach(function() {
    const fsmStates = {
      initialState: 'cool'
    };

    const fsmEvents = {
      blerp: { transition: { cool: 'herp' } }
    };

    this.sO = EmberObject.extend(Stateful, {
      fsmStates,
      fsmEvents
    });

    this.so = this.sO.create();
    this.fsm = this.so.get('__fsm__');
  });

  test('sets the state machine target to the includer', function(assert) {
    assert.strictEqual(this.so, this.fsm.get('target'));
  });

  test('provides fsmCurrentState', function(assert) {
    assert.strictEqual(this.so.get('fsmCurrentState'), 'cool');
  });

  test('can override the initial state', function(assert) {
    let so = this.sO.create({ fsmInitialState: 'herp' });
    assert.strictEqual(so.get('fsmCurrentState'), 'herp');
  });

  test('provides fsmIsLoading', function(assert) {
    assert.expect(2);

    assert.false(this.so.get('fsmIsLoading'));
    this.fsm.pushActiveTransition('t0');
    assert.true(this.so.get('fsmIsLoading'));
  });

  test('provides isIn{{State}} accessors', function(assert) {
    assert.expect(2);

    assert.ok(this.so.get('isInCool'));
    assert.notOk(this.so.get('isInHerp'));
  });

  test('delegates sendStateEvent to fsm.send', function(assert) {
    assert.expect(1);

    let done = assert.async();

    this.so.sendStateEvent('blerp').then(() => {
      next(() => {
        assert.strictEqual(this.so.get('fsmCurrentState'), 'herp');
        done();
      });
    });
  });
});
