export const INITIAL_TICKETS = [
  {
    id: 'BST-001', user: 'Kannanunni',
    title: 'App crashed after selecting + menu',
    message: 'Crashed after selecting any option from the + menu on iOS. Happening on both Bustler and Seeker sides.',
    category: 'Bug Report', urgency: 'Critical', urgency_score: 3,
    status: 'resolved', agent: 'Ambadi Sajan', time: '14/05/2026', route: 'bug'
  },
  {
    id: 'BST-002', user: 'Navaneeth',
    title: 'My Bustles page pops order details on refresh',
    message: 'When refreshing the My Bustles page it is popping out the order details page unexpectedly on Android.',
    category: 'Bug Report', urgency: 'Critical', urgency_score: 3,
    status: 'resolved', agent: 'Ambadi Sajan', time: '15/05/2026', route: 'bug'
  },
  {
    id: 'BST-003', user: 'Vivek',
    title: 'Booked time slot not removed from available slots',
    message: 'When a time slot is booked and accepted by the Bustler, it is not removed from the available time slots.',
    category: 'Bug Report', urgency: 'Critical', urgency_score: 3,
    status: 'resolved', agent: 'Ambadi Sajan', time: '08/05/2026', route: 'bug'
  },
  {
    id: 'BST-004', user: 'Vivek',
    title: 'Unable to make payment',
    message: 'Unable to make payment on the Seeker side. The payment page is not loading properly.',
    category: 'Bug Report', urgency: 'Critical', urgency_score: 3,
    status: 'progress', agent: 'Ambadi Sajan', time: '09/05/2026', route: 'bug'
  },
  {
    id: 'BST-005', user: 'Vivek',
    title: 'Payment confirmed but app asks to pay again',
    message: 'An advance payment was made but the app still asks to pay again after confirmation email was received.',
    category: 'Bug Report', urgency: 'Critical', urgency_score: 3,
    status: 'open', agent: 'Ambadi Sajan', time: '15/05/2026', route: 'bug'
  },
  {
    id: 'BST-006', user: 'Vivek',
    title: 'Message notifications not working',
    message: 'Message notifications are not working on both iOS and Android for both Bustler and Seeker sides.',
    category: 'Bug Report', urgency: 'High', urgency_score: 2,
    status: 'open', agent: 'Ambadi Sajan', time: '08/05/2026', route: 'bug'
  },
  {
    id: 'BST-007', user: 'Vivek',
    title: 'Job category edit not triggering review',
    message: 'Editing the job category after verification does not send it for review again.',
    category: 'Bug Report', urgency: 'High', urgency_score: 2,
    status: 'open', agent: 'Ambadi Sajan', time: '21/05/2026', route: 'bug'
  },
  {
    id: 'BST-008', user: 'Vivek',
    title: 'One-letter last name validation error',
    message: 'When entering a one-letter last name during sign-up, it shows an incorrect validation error.',
    category: 'Bug Report', urgency: 'Critical', urgency_score: 3,
    status: 'resolved', agent: 'Adhilekshmi R', time: '13/05/2026', route: 'bug'
  },
  {
    id: 'BST-009', user: 'Navaneeth',
    title: 'Favourites categories not updating in real time',
    message: 'After adding favourite categories, it only updates after closing and reopening the app.',
    category: 'Bug Report', urgency: 'High', urgency_score: 2,
    status: 'resolved', agent: 'Adhilekshmi R', time: '15/05/2026', route: 'bug'
  }
];

export const INITIAL_AGENTS = {
  'Ambadi Sajan': {
    initials: 'AS', color: 'var(--green)', dimColor: 'var(--gdim)', borderColor: 'var(--gborder)',
    role: 'Ops Intern · Pillar 2', resolved: 0, categories: {}, totalTime: 0, satisfaction: []
  },
  'Adhilekshmi R': {
    initials: 'AR', color: 'var(--blue)', dimColor: 'var(--bdim)', borderColor: 'rgba(78,158,255,.25)',
    role: 'Ops Intern · Pillar 3', resolved: 0, categories: {}, totalTime: 0, satisfaction: []
  },
  'Anjali P Remesh': {
    initials: 'AP', color: 'var(--purple)', dimColor: 'var(--pdim)', borderColor: 'rgba(167,139,250,.25)',
    role: 'Ops Intern · Pillar 1', resolved: 0, categories: {}, totalTime: 0, satisfaction: []
  },
  'Team Lead': {
    initials: 'TL', color: 'var(--red)', dimColor: 'var(--rdim)', borderColor: 'rgba(240,82,82,.25)',
    role: 'Operations Lead', resolved: 0, categories: {}, totalTime: 0, satisfaction: []
  }
};