import _STORAGE from './../storage'
import { _MODULE } from './../utils'
import _LOG_KEYS from './../../data/log-keys'

new _MODULE({
  events: {
    ENV: {
      'error': 'log',
      'warning': 'log',
      'failed:save-entry': 'log',
      'failed:update-entry': 'log',
      'failed:delete-entry': 'log',
      'failed:restoration': 'onFailedRestoration',
      'failed:pbm': 'onFailedPBM',
      'failed:open-tab': 'onOpenTabFailure',
      'error:import': 'log',
      'error:browser-console': 'log',
      'clear:logs': 'clear'
    }
  },

  log(error) {
    let log;
    if (error.time) {
      log = [error.time, error.message + ' [' + error.location + ']'];
    } else {
      log = [(new Date().getTime()), _LOG_KEYS[error]];
    }
    _STORAGE.set('log', log).then(() => this.emit('updated:logs logged:error', log));
  },
  clear() {
    _STORAGE.set('log', { clear: true }).then(() => this.emit('updated:logs'));
  },
  onFailedRestoration() {
    this.log('note_restoration_failure');
  },
  onOpenTabFailure() {
    this.log('note_url');
  },
  onFailedPBM() {
    this.log('note_pbm');
  }
});
