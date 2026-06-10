// ══════════════════════════════════════
// BUSTLER PULSE — ADAPTER.JS
// Updated with Bustler's real spreadsheet format
// ══════════════════════════════════════

// ── BUSTLER'S REAL SPREADSHEET FORMAT ──
// Date | Bustler/Seeker | iOS/Android | Bug | Attachment | Reported by | Status | Priority | Resolved or Not

// ── CATEGORY MAPPING ──
const CATEGORY_MAP = {
  'technical bug':    'Bug Report',
  'bug':              'Bug Report',
  'bug report':       'Bug Report',
  'crash':            'Bug Report',
  'error':            'Bug Report',
  'payment':          'Dispute',
  'payment issue':    'Dispute',
  'dispute':          'Dispute',
  'refund':           'Dispute',
  'confusion':        'User Confusion',
  'help':             'User Confusion',
  'question':         'User Confusion',
  'user confusion':   'User Confusion',
  'feedback':         'Feature Feedback',
  'feature':          'Feature Feedback',
  'suggestion':       'Feature Feedback',
  'general':          'General Issue',
  'other':            'General Issue'
};

// ── PRIORITY/URGENCY MAPPING ──
const URGENCY_MAP = {
  'p1':       { urgency: 'Critical', score: 3 },
  'p2':       { urgency: 'High',     score: 2 },
  'p3':       { urgency: 'Medium',   score: 2 },
  'p4':       { urgency: 'Low',      score: 1 },
  'critical': { urgency: 'Critical', score: 3 },
  'high':     { urgency: 'High',     score: 2 },
  'medium':   { urgency: 'Medium',   score: 2 },
  'low':      { urgency: 'Low',      score: 1 }
};

// ── STATUS MAPPING ──
const STATUS_MAP = {
  'open':        'open',
  'active':      'open',
  'new':         'open',
  'pending':     'open',
  'hold':        'progress',
  'in_progress': 'progress',
  'assigned':    'progress',
  'completed':   'resolved',
  'resolved':    'resolved',
  'closed':      'resolved',
  'done':        'resolved'
};

// ── ROUTE MAPPING ──
const ROUTE_MAP = {
  'Bug Report':       'bug',
  'User Confusion':   'confusion',
  'Dispute':          'dispute',
  'Feature Feedback': 'feedback',
  'General Issue':    'bug'
};

// ══════════════════════════════════════
// ADAPT FROM BUSTLER BACKEND FORMAT
// ══════════════════════════════════════
function adaptFromBustler(backendTicket) {
  try {
    // Map category
    const rawCategory = (
      backendTicket.category ||
      backendTicket.type ||
      'general'
    ).toLowerCase();
    const category = CATEGORY_MAP[rawCategory] || 'General Issue';

    // Map urgency/priority
    const rawUrgency = (
      backendTicket.urgency ||
      backendTicket.priority ||
      'p2'
    ).toLowerCase();
    const urgencyData = URGENCY_MAP[rawUrgency] || URGENCY_MAP['p2'];

    // Map status
    const rawStatus = (
      backendTicket.status ||
      'open'
    ).toLowerCase();
    const status = STATUS_MAP[rawStatus] || 'open';

    // Map agent
    const agent = mapAgentByCategory(category);

    // Build our ticket format
    return {
      id:            'TKT-' + String(backendTicket.id).padStart(3, '0'),
      user: backendTicket.reported_by || backendTicket.user_name || backendTicket.user_id || 'Unknown User',
      title:         generateTitle(backendTicket.description || backendTicket.bug, category),
      message:       backendTicket.description || backendTicket.bug || '',
      category:      category,
      urgency:       urgencyData.urgency,
      urgency_score: urgencyData.score,
      status:        status,
      agent:         agent,
      time:          formatTime(backendTicket.created_at || backendTicket.date),
      route:         ROUTE_MAP[category] || 'bug',
      platform:      backendTicket.platform || backendTicket.bustler_seeker || '',
      device:        backendTicket.device   || backendTicket.ios_android    || '',
      anger_detected: backendTicket.is_anger_flagged === 1,
      _backend_id:   backendTicket.id,
      screenshot_url: backendTicket.screenshot_url || null
    };

  } catch (e) {
    console.error('Adapter error:', e);
    return null;
  }
}

// ── ADAPT MANY AT ONCE ──
function adaptManyFromBustler(backendTickets) {
  return backendTickets
    .map(t => adaptFromBustler(t))
    .filter(t => t !== null);
}

// ── OUR FORMAT → BUSTLER FORMAT ──
function adaptToBustler(ourTicket) {
  try {
    const reverseStatus = {
      'open':     'open',
      'progress': 'in_progress',
      'resolved': 'resolved'
    };
    return {
      status:            reverseStatus[ourTicket.status] || 'open',
      assigned_agent_id: ourTicket.agent,
      resolved_at:       ourTicket.status === 'resolved' ? new Date().toISOString() : null
    };
  } catch (e) {
    console.error('adaptToBustler error:', e);
    return null;
  }
}

// ══════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════

// Auto-assign agent based on category
function mapAgentByCategory(category) {
  const map = {
    'Bug Report':       'Ambadi Sajan',
    'User Confusion':   'Adhilekshmi R',
    'Dispute':          'Anjali P Remesh',
    'Feature Feedback': 'Adhilekshmi R',
    'General Issue':    'Ambadi Sajan'
  };
  return map[category] || 'Ambadi Sajan';
}

// Generate title from description
function generateTitle(description, category) {
  if (!description) return category + ' reported';
  const words = description.split(' ').slice(0, 8).join(' ');
  return words.length < description.length ? words + '...' : words;
}

// Format timestamp to readable time
function formatTime(timestamp) {
  if (!timestamp) return 'Just now';
  try {
    // Handle dd/mm/yyyy format from spreadsheet
    if (timestamp.includes('/')) {
      const parts = timestamp.split('/');
      return parts[0] + '/' + parts[1] + '/' + parts[2];
    }
    const date = new Date(timestamp);
    const now   = new Date();
    const diff  = Math.floor((now - date) / 60000);
    if (diff < 1)  return 'Just now';
    if (diff < 60) return diff + 'm ago';
    const hours = Math.floor(diff / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    return days + 'd ago';
  } catch (e) {
    return 'Just now';
  }
}

// ── TEST ADAPTER ──
function testAdapter() {
  console.log('── ADAPTER TEST ──');
  const sampleBustlerTicket = {
    id:              1,
    user_id:         'user-001',
    category:        'Technical Bug',
    description:     'App is crashing when opening the + menu on iOS.',
    urgency:         'p1',
    status:          'open',
    is_anger_flagged: 0,
    created_at:      new Date().toISOString()
  };
  console.log('Bustler format:', sampleBustlerTicket);
  const ourTicket = adaptFromBustler(sampleBustlerTicket);
  console.log('Our format:', ourTicket);
  console.log('── TEST COMPLETE ──');
  return ourTicket;
}