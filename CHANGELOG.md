# Changelog

## ember-fsm-bridge

### 2.0.0-alpha.1

- Replace `@ember/error` with standard browser `Error` due to
  [deprecation](https://deprecations.emberjs.com/v4.x#toc_deprecate-ember-error)
  in Ember 4.x.

### 2.0.0-alpha.0

- [BREAKING] Package forked as `ember-fsm-bridge`.
- [BREAKING] Dropped support for Ember <3.28 and Node <14.
- [BREAKING] Previous import method (e.g. `FSM.Machine`) no longer works consistently; please use destructuring instead.
- Updated to work with Ember Octane / 4.x without deprecations.

## ember-fsm

### 1.1.0

- Updates to work with Ember 3.3+, thanks to @catz for the work on this

### 1.0.0

- `ember-fsm` is an Ember Addon now! `ember install ember-fsm` :tada:
