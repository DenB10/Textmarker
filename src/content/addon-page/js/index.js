import _ERRORTRACKER from './../../utils'
import { _L10N } from './../../utils'
import _NAV from './modules/nav'
import _TOGGLER from './modules/toggler'
import './port'
import './_store'
import './bootstrap'

_L10N();

/* configure navs */
let navs = document.getElementsByClassName('nav'),
    n = navs.length;

while(n--) new _NAV(navs[n]);

let tab = window.location.hash.split('=')[1],
    allowedVals = ['news', 'manual', 'settings', 'history', 'contact', 'sync', 'export', 'logs'];

if (allowedVals.includes(tab))
    window.document.getElementById('mainnav-' + tab).click();
/* end: configure navs */

/* configure toggle elements */
let toggleButtons = document.getElementsByClassName('toggle-button'),
    t = toggleButtons.length;

while(t--) new _TOGGLER(toggleButtons[t]);
/* end: configure toggle elements */
