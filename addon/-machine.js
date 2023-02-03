import EmberError from '@ember/error';
import { A } from '@ember/array';
import EmberObject, { computed } from '@ember/object';
import { typeOf } from '@ember/utils';
import { inspect } from '@ember/debug';
import { on } from '@ember/object/evented';
import Transition from './-transition';
import Definition from './-definition';
import { capitalCamelize, contains } from './utils';

export default EmberObject.extend({
  isTransitioning:   false,
  events:            null,
  states:            null,
  activeTransitions: null,
  currentState:      null,
  initialState:      null,

  init() {
    let target = this.target;
    let events = this.events;
    let states = this.states;

    if (!target) {
      this.set('target', this);
    }

    if (events && !events.error) {
      events.error = { transition: { $all: 'failed' } };
    }

    this.set('activeTransitions', A());

    this.definition = new Definition({
      states,
      events
    });

    this.set('stateNames',   this.definition.stateNames);
    this.set('eventNames',   this.definition.eventNames);
    this.set('currentState', this.initialState || this.definition.initialState);
  },

  send(event) {
    let args = [].slice.call(arguments, 1, arguments.length);
    let fsm = this;
    let transition;
    let promise;
    let sameState;

    if (!contains(this.eventNames, event)) {
      throw new EmberError(
        `unknown state event "${event}" try one of [` +
        this.eventNames.join(', ') + ']'
      );
    }

    transition = this.transitionFor(event, args);
    sameState  = transition.toState === this.currentState;

    if (this.isTransitioning && !sameState) {
      throw new EmberError(
        `unable to transition out of "${this.currentState}" ` +
        `state to "${transition.toState}" state while transitions are ` +
        `active: ${inspect(this.activeTransitions)}`
      );
    }

    promise = transition.perform();

    promise.catch(function(error) {
      fsm.abortActiveTransitions();
      fsm.send('error', {
        error: error,
        transition: transition
      });
    });

    return promise;
  },

  abortActiveTransition(transition) {
    if (this.hasActiveTransition(transition)) {
      transition.abort();
      this.removeActiveTransition(transition);
    }
  },

  hasActiveTransition(transition) {
    return contains(this.activeTransitions, transition);
  },

  abortActiveTransitions() {
    let activeTransitions = this.activeTransitions;

    while (activeTransitions.length) {
      activeTransitions.popObject().abort();
    }

    this.set('isTransitioning', false);
  },

  pushActiveTransition(transition) {
    let activeTransitions = this.activeTransitions;

    activeTransitions.pushObject(transition);

    if (activeTransitions.get('length')) {
      this.set('isTransitioning', true);
    }
  },

  removeActiveTransition(transition) {
    let activeTransitions = this.activeTransitions;

    activeTransitions.removeObject(transition);

    if (!activeTransitions.get('length')) {
      this.set('isTransitioning', false);
    }
  },

  checkGuard(guardProperty, isInverse) {
    let target     = this.target;
    let guardValue = target.get(guardProperty);
    let result;

    if (guardValue === undefined) {
      throw new Error(`expected guard "${guardProperty}" on target` +
      `"${target}" to be defined`);
    } else if (typeOf(guardValue) === 'function') {
      result = guardValue.call(this) ? true : false;
    } else {
      result = guardValue ? true : false;
    }

    return isInverse ? !result : result;
  },

  outcomeOfPotentialTransitions(potentials) {
    let target = this.target;
    let potential;
    let outcomeParams;
    let i;

    if (!potentials.length) {
      return null;
    }

    for (i = 0; i < potentials.length; i++) {
      potential = potentials[i];

      if (!potential.isGuarded) {
        outcomeParams = potential;
        break;
      }

      if (potential.doIf && this.checkGuard(potential.doIf)) {
        outcomeParams = potential;
        break;
      }

      if (potential.doUnless && this.checkGuard(potential.doUnless, true)) {
        outcomeParams = potential;
        break;
      }
    }

    if (!outcomeParams) {
      return null;
    }

    outcomeParams.machine = this;
    outcomeParams.target  = target;

    return outcomeParams;
  },

  transitionFor(event, args) {
    let currentState = this.currentState;
    let potentials   = this.definition.transitionsFor(event, currentState);
    let transitionParams;

    if (!potentials.length) {
      throw new EmberError(`no transition is defined for event "${event}" ` +
      `in state "${currentState}"`);
    }

    transitionParams = this.outcomeOfPotentialTransitions(potentials);

    if (!transitionParams) {
      throw new EmberError('no unguarded transition was resolved for event ' +
      `"${event}" in state "${currentState}"`);
    }

    transitionParams.eventArgs = args;

    return Transition.create(transitionParams);
  },

  inState(stateOrPrefix) {
    let currentState = this.definition.lookupState(this.currentState);
    let states       = this.definition.lookupStates(stateOrPrefix);

    return contains(states, currentState);
  },

  canEnterState(state) {
    let currentState = this.definition.lookupState(this.currentState);
    let potentials;

    potentials = currentState.exitTransitions.filter(function(t) {
      return t.toState === state;
    });

    return this.outcomeOfPotentialTransitions(potentials) ? true : false;
  },

  _setNewState_(transition) {
    this.set('currentState', transition.get('toState'));
  },

  _activateTransition_(transition) {
    this.pushActiveTransition(transition);
  },

  _deactivateTransition_(transition) {
    this.removeActiveTransition(transition);
  },

  _setupIsStateAccessors: on('init', function() {
    let mixin      = {};
    let prefixes   = this.definition.stateNamespaces.slice(0);
    let properties = [];
    let prefix;
    let i;

    function addAccessor(prefix) {
      let property = ('isIn' + capitalCamelize(prefix));

      properties.push(property);

      mixin[property] = computed('currentState', function() {
        return this.inState(prefix);
      });
    }

    for (i = 0; i < this.definition.stateNames.length; i++) {
      prefix = this.definition.stateNames[i];

      if (prefixes.indexOf(prefix) !== -1) {
        continue;
      }

      prefixes.push(prefix);
    }

    for (i = 0; i < prefixes.length; i++) {
      addAccessor(prefixes[i]);
    }

    this.isInStateAccessorProperties = properties;
    this.reopen(mixin);
  })
});
