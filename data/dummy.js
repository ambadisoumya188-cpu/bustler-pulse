// ══════════════════════════════════════
// BUSTLER PULSE — DUMMY.JS
// Updated with Bustler's real bug report data
// from their manual spreadsheet
// ══════════════════════════════════════

const TICKETS = [
  // ── REAL BUSTLER BUGS (from their spreadsheet) ──
  {
    id:            'BST-001',
    user:          'Kannanunni',
    title:         'App crashed after selecting + menu',
    message:       'Crashed after selecting any option from the + menu on iOS. Happening on both Bustler and Seeker sides.',
    category:      'Bug Report',
    urgency:       'Critical',
    urgency_score: 3,
    status:        'resolved',
    agent:         'Ambadi Sajan',
    time:          '14/05/2026',
    route:         'bug',
    platform:      'Both',
    device:        'iOS'
  },
  {
    id:            'BST-002',
    user:          'Navaneeth',
    title:         'My Bustles page pops order details on refresh',
    message:       'When refreshing the My Bustles page it is popping out the order details page unexpectedly on Android.',
    category:      'Bug Report',
    urgency:       'Critical',
    urgency_score: 3,
    status:        'resolved',
    agent:         'Ambadi Sajan',
    time:          '15/05/2026',
    route:         'bug',
    platform:      'Bustler',
    device:        'Android'
  },
  {
    id:            'BST-003',
    user:          'Vivek',
    title:         'Booked time slot not removed from available slots',
    message:       'When a time slot is booked and accepted by the Bustler, it is not removed from the available time slots. Users can still book the same slot.',
    category:      'Bug Report',
    urgency:       'Critical',
    urgency_score: 3,
    status:        'resolved',
    agent:         'Ambadi Sajan',
    time:          '08/05/2026',
    route:         'bug',
    platform:      'Seeker',
    device:        'Both'
  },
  {
    id:            'BST-004',
    user:          'Vivek',
    title:         'Unable to make payment',
    message:       'Unable to make payment on the Seeker side. The payment page is not loading properly on both iOS and Android.',
    category:      'Bug Report',
    urgency:       'Critical',
    urgency_score: 3,
    status:        'progress',
    agent:         'Ambadi Sajan',
    time:          '09/05/2026',
    route:         'bug',
    platform:      'Seeker',
    device:        'Both'
  },
  {
    id:            'BST-005',
    user:          'Vivek',
    title:         'Payment confirmed but app asks to pay again',
    message:       'An advance payment was made for a Bustler but the app closed suddenly during payment. A confirmation email was received but when reopening the app, it still asks to make the advance payment again.',
    category:      'Bug Report',
    urgency:       'Critical',
    urgency_score: 3,
    status:        'open',
    agent:         'Ambadi Sajan',
    time:          '15/05/2026',
    route:         'bug',
    platform:      'Seeker',
    device:        'Android'
  },
  {
    id:            'BST-006',
    user:          'Vivek',
    title:         'Message notifications not working',
    message:       'Message notifications are not working on both iOS and Android for both Bustler and Seeker sides. Users are missing important messages.',
    category:      'Bug Report',
    urgency:       'High',
    urgency_score: 2,
    status:        'open',
    agent:         'Ambadi Sajan',
    time:          '08/05/2026',
    route:         'bug',
    platform:      'Both',
    device:        'Both'
  },
  {
    id:            'BST-007',
    user:          'Vivek',
    title:         'Job category edit not triggering review',
    message:       'When a Bustle is created with a certain category and gets verified, editing the job category later does not send it for review again. This is a compliance issue.',
    category:      'Bug Report',
    urgency:       'High',
    urgency_score: 2,
    status:        'open',
    agent:         'Ambadi Sajan',
    time:          '21/05/2026',
    route:         'bug',
    platform:      'Seeker',
    device:        'Android'
  },
  {
    id:            'BST-008',
    user:          'Vivek',
    title:         'One-letter last name validation error on signup',
    message:       'When entering a one-letter last name during sign-up, it shows the message: "Last name can only contain letters, spaces, and dots." This is incorrect validation.',
    category:      'Bug Report',
    urgency:       'Critical',
    urgency_score: 3,
    status:        'resolved',
    agent:         'Adhilekshmi R',
    time:          '13/05/2026',
    route:         'bug',
    platform:      'Login Page',
    device:        'Both'
  },
  {
    id:            'BST-009',
    user:          'Navaneeth',
    title:         'Favourites categories not updating in real time',
    message:       'After adding favourite categories, it is not updating immediately. It is only updating after closing and reopening the app.',
    category:      'Bug Report',
    urgency:       'High',
    urgency_score: 2,
    status:        'resolved',
    agent:         'Adhilekshmi R',
    time:          '15/05/2026',
    route:         'bug',
    platform:      'Seeker',
    device:        'Android'
  }
];

// ── INCOMING QUEUE ──
// Simulates complaints coming from Anjali's user form
// In production these come automatically from the backend
const INCOMING = [
  {
    id:   'INC-001',
    user: 'Vivek',
    time: '2m ago',
    msg:  'Payment confirmed by email but app is still asking me to pay again. I have already paid the advance amount!'
  },
  {
    id:   'INC-002',
    user: 'Navaneeth',
    time: '5m ago',
    msg:  'My Bustles page is popping out order details every time I refresh. Very annoying bug.'
  },
  {
    id:   'INC-003',
    user: 'Kannanunni',
    time: '11m ago',
    msg:  'The app crashes every time I tap the + menu. Cannot create any new bustle at all.'
  },
  {
    id:   'INC-004',
    user: 'Vivek',
    time: '18m ago',
    msg:  'Message notifications are completely broken. I am missing all my client messages!'
  }
];

// ── AGENT DATA ──
const AGENTS = {
  'Ambadi Sajan': {
    initials:    'AS',
    color:       'var(--green)',
    dimColor:    'var(--gdim)',
    borderColor: 'var(--gborder)',
    role:        'Ops Intern · Pillar 2',
    resolved:    0,
    categories:  {},
    totalTime:   0,
    satisfaction: []
  },
  'Adhilekshmi R': {
    initials:    'AR',
    color:       'var(--blue)',
    dimColor:    'var(--bdim)',
    borderColor: 'rgba(78,158,255,.25)',
    role:        'Ops Intern · Pillar 3',
    resolved:    0,
    categories:  {},
    totalTime:   0,
    satisfaction: []
  },
  'Anjali P Remesh': {
    initials:    'AP',
    color:       'var(--purple)',
    dimColor:    'var(--pdim)',
    borderColor: 'rgba(167,139,250,.25)',
    role:        'Ops Intern · Pillar 1',
    resolved:    0,
    categories:  {},
    totalTime:   0,
    satisfaction: []
  },
  'Team Lead': {
    initials:    'TL',
    color:       'var(--red)',
    dimColor:    'var(--rdim)',
    borderColor: 'rgba(240,82,82,.25)',
    role:        'Operations Lead',
    resolved:    0,
    categories:  {},
    totalTime:   0,
    satisfaction: []
  }
};