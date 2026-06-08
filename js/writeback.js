// ══════════════════════════════════════
// BUSTLER PULSE — WRITEBACK.JS
// Ticket Status Write-back
// Writes resolved ticket data to localStorage
// so Anjali's and Adhilekshmi's layers can read it
// ══════════════════════════════════════

// ── WRITE RESOLVED TICKET ──
// Called every time a ticket is resolved in your dashboard
function writeResolvedTicket(ticket, timeTaken, satisfaction) {

  // Build the resolution data object
  const resolutionData = {
    ticket_id:        ticket.id,
    user:             ticket.user,
    title:            ticket.title,
    message:          ticket.message,
    category:         ticket.category,
    urgency:          ticket.urgency,
    resolved_by:      ticket.agent,
    resolved_at:      new Date().toISOString(),
    time_taken_hours: timeTaken,
    satisfaction:     satisfaction,
    status:           'resolved'
  };

  // ── WRITE TO ANJALI'S LAYER ──
  // Anjali's user layer reads this to show
  // "Your issue has been resolved" to the user
  writeToAnjaliLayer(resolutionData);

  // ── WRITE TO ADHILEKSHMI'S LAYER ──
  // Adhilekshmi's intelligence layer reads this
  // to auto-generate micro-reports and analytics
  writeToAdhilekshmiLayer(resolutionData);

  // ── WRITE TO OWN HISTORY ──
  // Keep a local history of all resolutions
  writeToOwnHistory(resolutionData);

  console.log('Write-back complete for ticket:', ticket.id);
}

// ── WRITE TO ANJALI'S LAYER ──
function writeToAnjaliLayer(data) {
  try {
    // Read existing resolved tickets for Anjali
    const existing = JSON.parse(
      localStorage.getItem('bustler_anjali_resolved') || '[]'
    );

    // Add new resolution
    existing.push({
      ticket_id:   data.ticket_id,
      user:        data.user,
      title:       data.title,
      status:      'resolved',
      resolved_at: data.resolved_at,
      resolved_by: data.resolved_by,
      message:     'Your issue has been resolved by our ops team. Thank you for your patience!'
    });

    // Save back
    localStorage.setItem('bustler_anjali_resolved', JSON.stringify(existing));
    console.log('Anjali layer updated — user will see resolution status');

  } catch (e) {
    console.error('Failed to write to Anjali layer:', e);
  }
}

// ── WRITE TO ADHILEKSHMI'S LAYER ──
function writeToAdhilekshmiLayer(data) {
  try {
    // Read existing reports for Adhilekshmi
    const existing = JSON.parse(
      localStorage.getItem('bustler_adhilekshmi_reports') || '[]'
    );

    // Build micro-report
    const report = {
      ticket_id:        data.ticket_id,
      category:         data.category,
      urgency:          data.urgency,
      resolved_by:      data.resolved_by,
      resolved_at:      data.resolved_at,
      time_taken_hours: data.time_taken_hours,
      satisfaction:     data.satisfaction,
      issue_summary:    data.title,
      root_cause:       getRootCause(data.category),
      fix_applied:      getFix(data.category),
      escalate_to_product: data.urgency === 'Critical' || data.urgency === 'High'
    };

    existing.push(report);

    // Save back
    localStorage.setItem('bustler_adhilekshmi_reports', JSON.stringify(existing));
    console.log('Adhilekshmi layer updated — micro-report generated');

  } catch (e) {
    console.error('Failed to write to Adhilekshmi layer:', e);
  }
}

// ── WRITE TO OWN HISTORY ──
function writeToOwnHistory(data) {
  try {
    const existing = JSON.parse(
      localStorage.getItem('bustler_ops_history') || '[]'
    );
    existing.push(data);
    localStorage.setItem('bustler_ops_history', JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to write to own history:', e);
  }
}

// ── HELPER: GET ROOT CAUSE ──
function getRootCause(category) {
  const causes = {
    'Bug Report':       'Technical issue in the platform — backend or frontend error',
    'User Confusion':   'UX gap — feature not intuitive enough for users',
    'Dispute':          'Freelancer-client conflict — payment or delivery issue',
    'Feature Feedback': 'User expectation not met by current feature set',
    'General Issue':    'Miscellaneous issue — needs further investigation'
  };
  return causes[category] || 'Unknown root cause';
}

// ── HELPER: GET FIX ──
function getFix(category) {
  const fixes = {
    'Bug Report':       'Bug identified and fix deployed by technical team',
    'User Confusion':   'User guided successfully — FAQ update recommended',
    'Dispute':          'Both parties contacted — resolution provided',
    'Feature Feedback': 'Feedback logged and forwarded to product team roadmap',
    'General Issue':    'Issue investigated and resolved by ops team'
  };
  return fixes[category] || 'Resolution applied';
}

// ── READ WRITEBACK DATA ──
// These functions let you check what has been written

function getAnjaliData() {
  return JSON.parse(localStorage.getItem('bustler_anjali_resolved') || '[]');
}

function getAdhilekshmiData() {
  return JSON.parse(localStorage.getItem('bustler_adhilekshmi_reports') || '[]');
}

function getOpsHistory() {
  return JSON.parse(localStorage.getItem('bustler_ops_history') || '[]');
}

// ── CLEAR ALL WRITEBACK DATA ──
// Use this to reset during testing
function clearWritebackData() {
  localStorage.removeItem('bustler_anjali_resolved');
  localStorage.removeItem('bustler_adhilekshmi_reports');
  localStorage.removeItem('bustler_ops_history');
  console.log('All writeback data cleared');
}

// ── SHOW WRITEBACK STATUS ──
// Shows a small toast notification when write-back is complete
function showWritebackStatus(ticketId) {
  // Create toast element
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--bg2);
    border: 1px solid var(--gborder);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 12px;
    color: var(--text);
    z-index: 999;
    animation: fadeUp 0.3s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    max-width: 280px;
  `;

  toast.innerHTML = `
    <div style="font-weight:500;color:var(--green);margin-bottom:4px">
      ✓ Write-back complete
    </div>
    <div style="color:var(--text2);line-height:1.5">
      ${ticketId} synced to:<br>
      → Anjali's user layer<br>
      → Adhilekshmi's intelligence layer
    </div>
  `;

  document.body.appendChild(toast);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}