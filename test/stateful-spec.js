describe('FSM.Stateful', function() {
  var so;
  var fsm;

  beforeEach(function() {
    var sO = Em.Object.extend(Em.FSM.Stateful, {
      states: {
        initialState: 'cool'
      },

      events: {
        blerp: { transition: { cool: 'herp' } }
      }
    });

    so  = sO.create();
    fsm = so.get('__fsm__');
  });

  it('sets the state machine target to the includer', function() {
    expect(so).toBe(fsm.get('target'));
  });

  it('provides currentState', function() {
    expect(so.get('currentState')).toBe('cool');
  });

  it('provides isLoading', function() {
    expect(so.get('isLoading')).toBe(false);
    fsm.pushActiveTransition('t0');
    expect(so.get('isLoading')).toBe(true);
  });

  it('provides isIn{{State}} accessors', function() {
    expect(so.get('isInCool')).toBe(true);
    expect(so.get('isInHerp')).toBe(false);
  });

  it('delegates sendStateEvent to fsm.send', function(done) {
    so.sendStateEvent('blerp').then(function() {
      Em.run.next(function() {
        expect(so.get('currentState')).toBe('herp');
        done();
      });
    });
  });
});