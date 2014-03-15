describe('FSM.MachineDefinition', function() {
  var MachineDefinition = Ember.FSM.MachineDefinition; // jshint ignore:line

  function create(args) {
    return new MachineDefinition(args);
  }

  describe('Instantiation', function() {
    it('requires new operator', function() {
      expect(function() {
        MachineDefinition({ events: {} }); // jshint ignore:line
      }).toThrowError(TypeError);
    });

    it('requires an "events" property', function() {
      expect(function() {
        create({ states: {} });
      }).toThrowError(TypeError);
    });

    it('requires "events" property to be an object', function() {
      expect(function() {
        create({ events: true });
      }).toThrowError(TypeError);
    });

    it('requires "states" property to be an object if passed', function() {
      expect(function() {
        create({
          events: { },
          states: true
        });
      }).toThrowError(TypeError);
    });

    it('sets initial state to default if none specified', function() {
      var def = create({
        events: {
          poke: {
            transitions: [
              { initialized: 'annoyed' }
            ]
          }
        }
      });
      expect(def.initialState).toBe('initialized');
    });

    it('requires at least one event', function() {
      expect(function() {
        create({ events: {} });
      }).toThrowError(/at least one/);
    });
  });

  describe('Explicitly defined states', function() {
    it('does not allow transitions to specify unlisted states', function() {
      expect(function() {
        create({
          states: {
            knownStates: ['initialized', 'farting']
          },
          events: {
            fart: {
              transitions: { initialized: 'farting' }
            },
            shart: {
              transitions: { farting: 'soiled' }
            }
          }
        });
      }).toThrowError(/not a defined state/);
    });

    it('does not allow specified states to be unused', function() {
      expect(function() {
        create({
          states: {
            initialState: 'wiggling',
            explicitStates: ['wiggling', 'wobbling', 'farting']
          },
          events: {
            wiggle: {
              transitions: [
                { wiggling: 'wobbling' }
              ]
            }
          }
        });
      }).toThrowError(/is not used/);
    });
  });

  describe('Compiling transitions', function() {
    it('aliases transition to transitions', function() {
      var def = create({
        events: {
          amaze: {
            transition: { initialized: 'x' }
          }
        }
      });

      expect(def.stateNames.length).toBe(2);
      expect(def.stateNames).toContain('initialized', 'x');
    });
  });

  describe('Unwinding transitions', function() {
    it('expands $all to all other known states', function() {
      var def = create({
        states: {
          initialState: 'a'
        },
        events: {
          reset: { transitions: { $all: 'a' } },
          fobble: { transitions: { a: 'x' } },
          doggle: { transitions: { a: 'y' } },
          wobble: { transitions: { a: 'z' } }
        }
      });

      ['a', 'x', 'y', 'z'].forEach(function(fromState) {
        var transitions = def.transitionsFor('reset', fromState);
        expect(transitions.length).toBe(1);
        expect(transitions[0].fromState).toBe(fromState);
      });
    });

    it('replaces $same with the state specified in fromState', function() {
      var def = create({
        events: {
          toA: {
            transitions: [
              { initialized: 'a' },
              { a: '$same' }
            ]
          }
        }
      });

      var transitions = def.transitionsFor('toA', 'a');

      expect(transitions.length).toBe(1);
      expect(transitions[0].toState).toBe('a');
    });

    it('allows multiple guarded transitions with the same from state', function() {
      var def = create({
        states: {
          initialState: 'off'
        },
        events: {
          run: {
            transitions: [
              { on: '$same' },
              { off: 'on', unless: 'isWarm' },
              { off: 'on', guard: 'hasPower' },
            ]
          }
        }
      });

      var transitions = def.transitionsFor('run', 'off');

      expect(transitions.length).toBe(2);

      transitions.forEach(function(t) {
        expect(t.isGuarded).toBe(true);
      });
    });

    it('does not allow multiple transitions per transition definition', function() {
      // The reason why is that the order of objects can't be predicted but
      // order of transitions is important when using guards
      expect(function() {
        create({
          events: {
            pedal: {
              transitions: {
                'initialized':    'mounting',
                'mounting':       'moving.slowly',
                'moving.slowly':  'moving.quickly',
                'moving.quickly': '$same'
              }
            }
          }
        });
      }).toThrowError(/only one .+ per object/);
    });

    it('does not allow unguarded transitions with the same from state', function() {
      expect(function() {
        create({
          states: { initialState: 'off' },
          events: {
            run: {
              transitions: [
                { on: '$same' },
                { off: 'on' },
                { off: 'on' }
              ]
            }
          }
        });
      }).toThrowError(/more than one/);

      expect(function() {
        create({
          states: { initialState: 'off' },
          events: {
            run: {
              transitions: [
                { on: '$same' },
                { off: 'on' },
                { $all: 'on' }
              ]
            }
          }
        });
      }).toThrowError(/more than one/);
    });
  });

  describe('Unwound transitions', function() {
    function build(transitions) {
      return create({
        states: { initialState: 'a' },
        events: { run: { transitions: transitions } }
      }).transitionsFor('run');
    }

    it('sets array properties to be arrays', function() {
      var t = build([
        { a: 'b', before: 'doTing' },
        { d: 'e', willEnter: 'doTing' },
        { f: 'g', didEnter: 'doTing' },
        { h: 'i', willExit: 'doTing' },
        { j: 'k', didExit: 'doTing' },
        { b: 'c', after: 'doTing' }
      ]);

      expect(t[0].beforeEvent).toContain('doTing');
      expect(t[1].willEnter).toContain('doTing');
      expect(t[2].didEnter).toContain('doTing');
      expect(t[3].willExit).toContain('doTing');
      expect(t[4].didExit).toContain('doTing');
      expect(t[5].afterEvent).toContain('doTing');
    });

    it('passes through non-array properties', function() {
      var t = build([
        { a: 'b', guard: 'hasTing' },
        { b: 'c', unless: 'hasTing' }
      ]);

      expect(t[0].doIf).toBe('hasTing');
      expect(t[1].doUnless).toBe('hasTing');
    });

    it('allows fromStates and toState to be passed as named properties', function() {
      var t = build({ from: 'a', to: 'b' });

      expect(t[0].fromState).toBe('a');
      expect(t[0].toState).toBe('b');
    });

    it('allows multiple fromStates to be specified in one transition', function() {
      var t = build({ from: ['a', 'b'], to: 'c' });

      expect(t.length).toBe(2);
      expect(t[0].fromState).toBe('a');
      expect(t[0].toState).toBe('c');
      expect(t[1].fromState).toBe('b');
      expect(t[1].toState).toBe('c');
    });
  });

  describe('Public API', function() {
    var def = create({
      events: {
        one: { transitions: { initialized: 'a' } },
        two: { transitions: { a: 'b' } }
      }
    });

    it('provides eventNames', function() {
      expect(def.eventNames.length).toBe(2);
      expect(def.eventNames).toContain('one', 'two');
    });

    it('provides events', function() {
      expect(def.events.length).toBe(2);
      expect(def.events.mapBy('name')).toContain('one', 'two');
    });

    it('provides stateNames', function() {
      expect(def.stateNames.length).toBe(3);
      expect(def.stateNames).toContain('initialized', 'a', 'b');
    });

    it('provides states', function() {
      expect(def.states.length).toBe(3);
      expect(def.states.mapBy('name')).toContain('initialized', 'a', 'b');
    });

    it('can look up states by name', function() {
      expect(def.lookupState('a').name).toBe('a');
    });

    it('can look up events by name', function() {
      expect(def.lookupEvent('one').name).toBe('one');
    });

    it('can look up transitions by event', function() {
      expect(def.transitionsFor('one').length).toBe(1);
    });

    it('can look up transitions by event and starting state', function() {
      expect(def.transitionsFor('one', 'initialized').length).toBe(1);
      expect(def.transitionsFor('one', 'b').length).toBe(0);
    });
  });
});