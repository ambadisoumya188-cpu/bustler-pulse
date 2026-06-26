// ══════════════════════════════════════
// BUSTLER PULSE — ADAPTER.JS
// Updated with Bustler's real spreadsheet format
// + now also maps real AI-triage fields from Adhilekshmi's backend
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
// Note: Adhilekshmi's real AI triage sends lowercase 'low' / 'medium' / 'critical'.
// The old spreadsheet priority values (p1-p4 / high) are kept too so nothing breaks.
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

// ── ROUTE MAPPING (category → internal page filter, unchanged/unused by triage) ──
const ROUTE_MAP = {
  'Bug Report':       'bug',
  'User Confusion':   'confusion',
  'Dispute':          'dispute',
  'Feature Feedback': 'feedback',
  'General Issue':    'bug'
};

// ── REAL AI TRIAGE: route_to TEAM LABELS ──
// Adhilekshmi's backend sends raw team keys like 'refund_team'. This turns
// them into a readable label for the AI Triage panel. This is separate from
// the existing intern-assignment (`agent`) logic below — it does not touch it.
const ROUTE_TO_LABELS = {
  payment_team: 'Payment Team',
  refund_team:  'Refund Team',
  ops_agent:    'Ops Agent',
  dispute_team: 'Dispute Team'
};
function labelRouteTo(rawRoute) {
  if (!rawRoute) return null;
  if (ROUTE_TO_LABELS[rawRoute]) return ROUTE_TO_LABELS[rawRoute];
  // Fallback: turn 'some_new_team' into 'Some New Team' so unknown future
  // values from the backend still display reasonably instead of breaking.
  return rawRoute.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

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

    // Map agent (intern assignment — unrelated to AI route_to teams)
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
      created_at:    backendTicket.created_at || backendTicket.date,
      route:         ROUTE_MAP[category] || 'bug',
      platform:      backendTicket.platform || backendTicket.bustler_seeker || '',
      device:        backendTicket.device   || backendTicket.ios_android    || '',
      anger_detected: backendTicket.is_anger_flagged === 1,
      _backend_id:   backendTicket.id,
      screenshot_url: backendTicket.screenshot_url || null,

      // ── REAL AI TRIAGE FIELDS (from Adhilekshmi's automatic backend triage) ──
      route_to:        labelRouteTo(backendTicket.route_to),
      auto_reply:      backendTicket.auto_reply || null,
      auto_reply_sent: backendTicket.auto_reply_sent === 1,
      // True once the backend has actually run AI triage on this ticket.
      // is_anger_flagged is always present once triage has run, even when 0,
      // so its presence is a reliable signal that triage has completed.
      _triaged: backendTicket.is_anger_flagged !== undefined && backendTicket.is_anger_flagged !== null
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
    route_to:        'ops_agent',
    auto_reply:       'Thanks, our team is on it.',
    auto_reply_sent:  1,
    created_at:      new Date().toISOString()
  };
  console.log('Bustler format:', sampleBustlerTicket);
  const ourTicket = adaptFromBustler(sampleBustlerTicket);
  console.log('Our format:', ourTicket);
  console.log('── TEST COMPLETE ──');
  return ourTicket;
}