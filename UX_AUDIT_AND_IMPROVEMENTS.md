# Imole AI - UX Audit & User Journey Improvements

**Date:** May 21, 2026  
**Status:** MVP Phase Analysis

---

## Executive Summary

The Imole AI platform has a solid foundation with three distinct user journeys. However, there are significant UX gaps, workflow inefficiencies, and missing features that impact productivity and user satisfaction. This audit identifies critical issues and recommends prioritized improvements for Phase 2.

---

## Current User Journeys Overview

### 1. **Radiologist Journey**
```
Login → Dashboard → View Assigned Cases → DICOM Viewer → Write Report → Submit → Complete
```

### 2. **Diagnostic Center Journey**
```
Login → Dashboard → Upload Scan → Complete Form → Monitor Cases → View Reports
```

### 3. **Admin Journey**
```
Login → Dashboard → View All Cases → Assign Radiologists → Monitor Performance → Settings
```

---

## 🔴 Critical Issues & Pain Points

### **RADIOLOGIST WORKFLOW**

#### Issue #1: Weak Case Assignment Visibility
- **Problem:** Radiologists have no control or visibility over case distribution
  - Assigned cases appear automatically
  - No option to accept/decline/defer cases
  - No workload management UI
  - Can't prioritize which cases to tackle first
- **Impact:** Leads to bottlenecks, inability to manage personal capacity
- **Priority:** HIGH

#### Issue #2: No Cine Loop Controls in DICOM Viewer
- **Problem:** Radiologist sees basic viewer but missing critical tools
  - No speed control for cine play (currently hardcoded to 500ms)
  - No measurement/annotation tools on canvas
  - No windowing saved presets for different anatomies
  - No comparison with prior studies
- **Impact:** Slows down reading, increases errors, reduces efficiency
- **Priority:** HIGH

#### Issue #3: AI Report Draft Not Well Integrated
- **Problem:** AI generation is hidden in "Generate AI Draft" button
  - Users must manually click to trigger AI
  - No real-time feedback while processing
  - AI confidence score exists but not displayed in final report
  - No AI-suggested findings highlight/review flow
- **Impact:** Underutilizes AI capability, creates extra friction
- **Priority:** HIGH

#### Issue #4: Report Template System Missing
- **Problem:** Only 3-4 hardcoded templates (normal, chest_ct, brain_mri, clear)
  - No way to create custom templates per scan type
  - No specialty-specific templates
  - No quick-insert sections for common findings
- **Impact:** Radiologists waste time on repetitive typing
- **Priority:** MEDIUM

#### Issue #5: No Report Signing/Verification Workflow
- **Problem:** Report submitted but no digital signing
  - No audit trail for report changes
  - No QA review queue for senior radiologists
  - No notification when report is finalized vs. draft
- **Impact:** Regulatory/compliance risk, no quality gates
- **Priority:** HIGH

#### Issue #6: Radiologist Has No Personal Reporting Stats
- **Problem:** Dashboard shows global metrics, not individual stats
  - No personal turnaround time tracking
  - No case volume per day
  - No feedback on quality of reports (if any)
- **Impact:** Radiologists can't self-assess or improve
- **Priority:** MEDIUM

---

### **DIAGNOSTIC CENTER WORKFLOW**

#### Issue #7: Upload Form Has Poor UX
- **Problem:** Multi-step form is confusing and repetitive
  - User must select scan type first (good), but body part is separate dropdown
  - Clinical history field is optional but critical
  - No real validation (filesize, format checks only happen on backend)
  - Progress indicators misleading (simulated, not real)
- **Impact:** Data quality issues, incomplete submissions, poor onboarding
- **Priority:** HIGH

#### Issue #8: No Batch Upload Capability
- **Problem:** Can only upload one case at a time
  - Centers often have 5-10 scans daily
  - No bulk import from PACS systems
  - No scheduled/recurring uploads
- **Impact:** Time-consuming for high-volume centers
- **Priority:** MEDIUM

#### Issue #9: Case Status Stuck in "Limbo"
- **Problem:** After upload, center sees case in "pending" → "assigned" → "in_progress" → "completed"
  - No granular status updates (e.g., "reading started at 3:45pm")
  - No estimated time to completion
  - No push notifications to center when status changes
- **Impact:** Centers don't know when to expect reports, creates friction
- **Priority:** HIGH

#### Issue #10: No Report Delivery Mechanism
- **Problem:** Report form generates PDF but centers can't download it directly
  - No report history/archive
  - No ability to resend reports
  - No email notification when report is ready
- **Impact:** Centers have to ask for reports manually, bad UX
- **Priority:** HIGH

#### Issue #11: Missing Invoicing/Billing
- **Problem:** Prices are hardcoded in SCAN_TYPE_CONFIG but no billing flow
  - No invoice generation
  - No payment tracking
  - No credit system
- **Impact:** No revenue realization, business blocker
- **Priority:** MEDIUM (Phase 2+)

---

### **ADMIN WORKFLOW**

#### Issue #12: Case Assignment Is Manual & Inefficient
- **Problem:** Admin must manually assign each pending case to a radiologist
  - No smart assignment logic (specialty, workload, availability)
  - No bulk assign capability
  - No assignment rules/policies
  - Assignment dropdown doesn't show radiologist current caseload
- **Impact:** Admin becomes bottleneck, cases pile up in pending
- **Priority:** HIGH

#### Issue #13: No Radiologist Workload Management
- **Problem:** Admin can't see real-time radiologist workload
  - No "availability status" UI
  - Can't see which radiologists are overloaded
  - No on-call schedule management
  - No shift/roster management
- **Impact:** Unbalanced caseloads, radiologists overwhelmed
- **Priority:** HIGH

#### Issue #14: Centers & Radiologists Management Incomplete
- **Problem:** "Coming in Phase 2" placeholder screens
  - Can't add/remove centers
  - Can't add/remove radiologists
  - Can't manage credentials/permissions
  - Can't configure scan type access per radiologist
- **Impact:** System can't onboard new users, not production-ready
- **Priority:** HIGH

#### Issue #15: No Performance Analytics
- **Problem:** Dashboard shows only basic metrics (total cases, pending, etc.)
  - No turnaround time trends by radiologist
  - No quality metrics (errors, rejections)
  - No revenue analytics
  - No diagnostic center performance ranking
- **Impact:** Can't identify bottlenecks or optimize
- **Priority:** MEDIUM

#### Issue #16: No Notification/Alert System
- **Problem:** Notifications bell is cosmetic (no real backend)
  - No alerts for urgent cases
  - No alerts when radiologist misses SLA
  - No alerts when center uploads report with issues
- **Impact:** Critical events are missed
- **Priority:** HIGH

---

### **CROSS-CUTTING ISSUES**

#### Issue #17: Authentication Too Simplistic
- **Problem:** Hardcoded demo credentials, no real auth backend
  - No OAuth/SSO integration
  - No password reset
  - No 2FA
  - No session timeout
- **Impact:** Not secure for production, regulatory risk
- **Priority:** HIGH (Pre-launch)

#### Issue #18: No Real DICOM Handling
- **Problem:** Using mock images instead of actual DICOM parsing
  - No real DICOM viewer library (cornerstone-tools installed but unused)
  - No DICOM validation
  - No PACS integration
- **Impact:** Not actually reading medical images, non-functional
- **Priority:** CRITICAL

#### Issue #19: Mobile Responsiveness
- **Problem:** Layout is desktop-first, poor on mobile/tablet
  - Sidebar takes 256px (not responsive)
  - Long tables don't wrap properly
  - Touch targets too small for mobile
- **Impact:** Radiologists can't work on tablets, centers can't upload on phones
- **Priority:** MEDIUM

#### Issue #20: Accessibility Issues
- **Problem:** Missing ARIA labels, keyboard navigation gaps
  - DICOM viewer tools not keyboard accessible
  - Report form missing error announcements
  - Color-only status indicators (not colorblind friendly)
- **Impact:** Non-compliant with WCAG, excludes users with disabilities
- **Priority:** MEDIUM

#### Issue #21: No Data Persistence
- **Problem:** All data stored in React state, lost on refresh
  - No backend integration
  - No database
  - Mock data resets
- **Impact:** Not viable for production, data loss risk
- **Priority:** CRITICAL (Pre-launch)

#### Issue #22: Print/Export Limitations
- **Problem:** PDF export works but limited
  - No batch report export
  - Can't export case summaries as CSV
  - No standard DICOM export/sharing
- **Impact:** Hard to integrate with external systems
- **Priority:** MEDIUM

---

## 🟢 Recommended Improvements (Prioritized)

### **PHASE 1 (NOW - MVP Completion)**

#### Priority 1: Real DICOM Viewer Implementation
- Integrate actual cornerstone-core + cornerstone-tools
- Add measurement, annotation tools
- Implement cine speed control slider
- Add window/level presets per anatomy
- Load real DICOM files from mock API or S3

**Effort:** XL | **Impact:** CRITICAL

---

#### Priority 2: Radiologist Case Management UI
- **Accept/Decline Cases Button**
  - Let radiologists accept/decline/defer assignments
  - Shows current workload before accepting

- **Personal Dashboard Stats**
  - Today's cases: in progress, completed
  - Average time per case
  - Case volume by scan type

- **Case Priority Sorting**
  - Sort by urgency (STAT first)
  - Sort by time received (oldest first)
  - Sort by SLA (due soonest)

**Effort:** M | **Impact:** HIGH

---

#### Priority 3: Improve Report Writing Workflow
- **Live AI Preview**
  - Show AI-generated text as user types clinical history
  - Highlight confidence score on findings
  - Allow user to approve/edit AI sections vs. free-form

- **Saved Templates**
  - Let radiologists create and save custom templates
  - Quick-insert sections (e.g., "Normal lungs" → fills text)
  - Template library per scan type

- **Report Drafting Save**
  - Auto-save draft every 30 seconds
  - Show "draft" badge until submitted
  - Allow resume interrupted reports

**Effort:** L | **Impact:** HIGH

---

#### Priority 4: Case Status & Notification System
- **Real-time Status Updates**
  - When case moves to "reading started" → push notification to center
  - When report completed → push notification
  - Show ETA on case detail

- **Backend Notifications** (at least stub)
  - Urgent case alert for all radiologists
  - SLA breach warning
  - Radiologist unavailability alerts

**Effort:** M | **Impact:** HIGH

---

#### Priority 5: Admin Smart Assignment
- **Smart Assignment Logic**
  - Auto-assign pending cases to available radiologist with lowest workload
  - Filter by specialty (radiologist can do CT scans, case is CT)
  - Respect max cases per day

- **Manual Override**
  - Option to manually choose radiologist
  - Show radiologist's current caseload in dropdown

- **Bulk Operations**
  - Assign multiple pending cases at once

**Effort:** M | **Impact:** HIGH

---

#### Priority 6: Diagnostic Center Report Download
- **Report Delivery**
  - Download PDF directly from case detail view
  - Email report link to center
  - Archive/history view of all past reports

- **Better Upload Status**
  - Show real upload progress (not simulated)
  - Show clear "Assigned to Dr. X, ETA: 2h" message
  - Show granular status: submitted → assigned → reading → completed

**Effort:** M | **Impact:** HIGH

---

### **PHASE 2 (Next Sprint)**

#### Priority 7: Admin Centers & Radiologists Management
- Implement full CRUD for Diagnostic Centers
- Implement full CRUD for Radiologists
- Manage specializations per radiologist
- Configure access permissions

**Effort:** L | **Impact:** HIGH

---

#### Priority 8: Advanced Analytics Dashboard
- Radiologist performance metrics (turnaround, volume, quality)
- Diagnostic center ranking/performance
- Revenue analytics by center, scan type, radiologist
- Trend charts (cases over time, SLA compliance)

**Effort:** L | **Impact:** MEDIUM

---

#### Priority 9: Real Authentication Backend
- Replace mock auth with real backend
- JWT token management
- Password reset flow
- Optional: OAuth/SSO integration

**Effort:** M | **Impact:** HIGH

---

#### Priority 10: Batch Upload & PACS Integration
- Batch DICOM upload UI
- CSV import for case metadata
- PACS connector (e.g., DICOM Web)

**Effort:** L | **Impact:** MEDIUM

---

#### Priority 11: Billing & Invoicing
- Invoice generation per case
- Monthly billing reports
- Payment tracking dashboard
- Credit system for repeat customers

**Effort:** L | **Impact:** MEDIUM

---

#### Priority 12: Mobile Responsive Redesign
- Make sidebar collapsible on mobile
- Responsive table views (card layout on mobile)
- Touch-friendly button sizes

**Effort:** M | **Impact:** MEDIUM

---

### **PHASE 3 (Future)**

- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Multi-language support (Yoruba, Hausa, Igbo)
- [ ] Advanced QA/review workflows with senior radiologist sign-off
- [ ] Automated quality scoring (AI-based report auditing)
- [ ] Prior studies comparison view
- [ ] AI diagnostic suggestions (not just report templates)
- [ ] HL7/FHIR integration with hospital EHRs
- [ ] Teleconference integration for urgent case discussion

---

## 📊 Impact Summary

| Issue # | Title | Severity | Phase | Effort | User Impact |
|---------|-------|----------|-------|--------|-------------|
| 1 | Weak case assignment visibility | HIGH | 1 | M | Radiologist workload management |
| 2 | Missing DICOM viewer tools | HIGH | 1 | XL | Radiologist reading speed/accuracy |
| 3 | AI integration weak | HIGH | 1 | M | Report writing efficiency |
| 5 | No report signing workflow | HIGH | 1 | M | Compliance/audit trail |
| 7 | Poor upload UX | HIGH | 1 | M | Data quality, center friction |
| 9 | Case status limbo | HIGH | 1 | M | Center notification, transparency |
| 10 | No report delivery | HIGH | 1 | M | Center usability |
| 12 | Manual case assignment | HIGH | 1 | M | Admin bottleneck |
| 13 | No radiologist workload view | HIGH | 1 | M | Load balancing |
| 14 | Centers/Radiologists CRUD missing | HIGH | 2 | L | System completeness |
| 16 | No notification system | HIGH | 1 | M | Alert reliability |
| 18 | No real DICOM handling | **CRITICAL** | 1 | XL | Core functionality |
| 21 | No data persistence | **CRITICAL** | 1 | L | Production readiness |

---

## 🎯 Recommended Immediate Next Steps

### Week 1-2:
1. Set up real backend (Node/Python) for authentication & data persistence
2. Integrate real DICOM viewer library
3. Add radiologist case accept/decline UI

### Week 3-4:
4. Implement case status notifications (at least in-app)
5. Improve report writing with templates & AI preview
6. Improve diagnostic center upload & report delivery

### Week 5+:
7. Admin smart assignment logic
8. Analytics dashboard
9. Centers & Radiologists management UI

---

## Additional Considerations

### UX Principles to Maintain
- **Role-based simplicity:** Each role sees only what they need
- **Clear status visibility:** Users always know case status
- **Minimal clicks:** Critical actions should be 1-2 clicks
- **Fast feedback:** Instant visual confirmation of actions

### Design Tokens to Establish
- Status colors: pending (amber), assigned (blue), in_progress (purple), completed (green), cancelled (slate)
- Urgency indicators: routine (neutral), urgent (amber), STAT (red)
- Roles: diagnostic_center (blue), radiologist (green), admin (purple)

### Performance Targets
- **Case assignment SLA:** <15 minutes from upload
- **Reading start SLA:** <30 minutes from assignment
- **Report turnaround:** X-Ray 1h, CT 3h, MRI 6h, Ultrasound 2h
- **UI response time:** All actions <500ms

---

## Conclusion

The MVP has strong foundational UI/UX, but needs critical backend integration, real DICOM handling, and improved workflows for each user role. Focus on **Priorities 1-6** to make this production-ready. The roadmap is clear and achievable in 2-3 sprints.

