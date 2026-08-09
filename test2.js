const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

// A very basic mock DOM to test if it's hitting an exception
let eventListeners = {};
const fakeEl = (id) => ({
    id,
    classList: { add: ()=>{}, remove: ()=>{} },
    addEventListener: (e, cb) => { eventListeners[id] = cb; },
    value: '',
    textContent: '',
    focus: ()=>{}
});
const ids = [
    'nav-schedule-btn', 'nav-store-btn', 'nav-parent-btn', 'schedule-view', 'store-view', 'parent-view',
    'total-score', 'current-date', 'task-list', 'kid-task-count', 'simulate-time', 'reset-btn', 'live-time',
    'store-total-score', 'store-list', 'kid-store-count',
    'lock-portal-btn', 'change-pass-btn', 'parent-total-score', 'parent-event-count', 'parent-adj-count',
    'open-add-event-btn', 'open-add-store-btn', 'open-adjust-points-btn', 'parent-event-list', 'parent-store-list', 'points-history-list',
    'password-modal', 'password-form', 'parent-password-input', 'toggle-pass-visibility', 'password-error', 'close-password-modal', 'cancel-password-btn',
    'event-modal', 'event-modal-title', 'event-form', 'event-edit-id', 'event-title-input', 'event-points-input', 'event-time-input', 'event-penalty-input', 'close-event-modal', 'cancel-event-btn',
    'store-modal', 'store-form', 'close-store-modal', 'cancel-store-btn',
    'points-modal', 'points-form', 'points-amount-input', 'points-reason-input', 'close-points-modal', 'cancel-points-btn',
    'change-pass-modal', 'change-pass-form', 'current-pass-input', 'new-pass-input', 'confirm-pass-input', 'close-change-pass-modal', 'cancel-change-pass-btn', 'pass-change-error',
    'store-modal-title', 'store-edit-id', 'store-title-input', 'store-points-input', 'store-icon-input', 'store-available-input'
];

global.document = {
    addEventListener: (ev, cb) => {
        if(ev === 'DOMContentLoaded') cb();
    },
    getElementById: (id) => {
        if (ids.includes(id)) {
            let el = fakeEl(id);
            if (id === 'store-modal') {
                el.classList.remove = (c) => console.log('REMOVED CLASS', c, 'FROM store-modal');
            }
            return el;
        }
        return null;
    },
    createElement: () => ({ className: '', appendChild: ()=>{}, innerHTML: '', querySelector: ()=>({ addEventListener: ()=>{} }) }),
    querySelector: () => ({ forEach: ()=>{} }),
    querySelectorAll: () => []
};

global.window = {};
global.localStorage = { getItem: ()=>null, setItem: ()=>{} };
global.confirm = () => true;
global.alert = () => true;

try {
    eval(js);
    if (eventListeners['open-add-store-btn']) {
        console.log('Listener exists. Calling it.');
        eventListeners['open-add-store-btn']();
    } else {
        console.log('Listener NOT found.');
    }
} catch (e) {
    console.error('ERROR IN EVAL:', e);
}
