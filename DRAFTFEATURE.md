# DRAFT FEATURE — Face Recognition for HRM Attendance (Deferred)

> **Status: DRAFT / NOT IMPLEMENTED**
> This is a proposal only. The **implemented** approach for attendance security is the
> **QR account-scan** flow (see the live plan in this repo). Face recognition is deferred
> because client-side accuracy concerns were raised. This document captures the intended
> design so it can be revisited.

## Why this is deferred
- Client-side face recognition is not reliable enough to be the **only** gate
  (lighting, angle, distance, spoofing).
- Some computers don't have a camera, requiring a "phone as camera" pairing path.
- The current system uses **QR account-scan** instead, which is accurate by design
  (it confirms the employee's own authenticated account at the terminal).

## Goal
When creating an employee, the HRM/admin registers that employee's face. On the day of
attendance the employee must be physically present and their face matched before the
"present" record is written. The **same** face is used for both enrollment and daily
verification.

## Intended architecture (client-side face-api.js)
- Engine: [face-api.js](https://github.com/justadudewhohacks/face-api.js) on TensorFlow.
- Run entirely in the browser — no server model, no heavy Python deps.
- Enroll and compare **descriptor vectors** (128-d embedding) stored on the employee record.

### Backend
- `OrgEmployee`: add `face_descriptor` (Text; JSON array of floats), nullable.
- `OrgAttendance`: add `face_verified` (Boolean), `verified_at` (String).
- `POST /employees` accepts an optional `faceDescriptor` when HRM enrolls.
- `POST /attendance/check-in` accepts an optional `faceDescriptor`; if the org has
  face enforcement enabled, the server rejects unless the descriptor matches the
  employee's stored one (cosine similarity above a threshold, e.g. 0.6).
- Org-level toggle `OrgOrganisation.face_enforcement` + `face_threshold`.

### Frontend — enrollment (create employee)
- In the employee creation form, HRM clicks "Enroll face".
- Opens a camera capture modal (webcam).
- `faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor()`.
- On success, saves descriptor to the employee create/update payload.

### Frontend — phone-as-camera pairing (deferred)
- Terminal (PC) shows a QR code pointing to a backend-served mobile capture page.
- HRM's phone camera scans the QR, opens the page, captures a face.
- The phone sends the descriptor (via a short-lived pairing token in the QR) back to the
  terminal, which submits it with the check-in.
- Extra infrastructure required: a mobile capture page + a transfer channel (poll/websocket).

### Frontend — daily check-in verification
- Terminal selects the employee (search by name).
- Camera modal runs live detection; on a confident match the "Present" button unlocks.
- On mismatch, shows a retry / manual-override (admin-only) option.

## Open questions / risks
- Threshold tuning and false rejects.
- Spoofing with a printed photo (need liveness, e.g. blink detection).
- Camera-less terminals full reliance on the phone-as-camera path.
- Storage size of per-employee descriptors (small; negligible).

## Priority ordering if revived
1. Backend model + descriptor storage + similarity gate.
2. Webcam enrollment + verification on camera-equipped terminals.
3. Manual-override for admin only.
4. QR phone-as-camera pairing (most effort, do last).
