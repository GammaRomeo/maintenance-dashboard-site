// Pure merge/de-dupe logic for combining a vehicle's local self-reported
// fastener records with the same identity's remote self-reports fetched from
// the beta worker (GET /api/beta/selfreports — see beta-worker/src/worker.js
// and beta.js's fetchSelfReports()). Kept dependency-free (no window/DOM/
// localStorage) so it can be included as a plain <script> in navigator.html
// and also required directly from a Node test.
//
// De-dupe rule: prefer the record's stable `id` (assigned client-side at
// creation time — see navigator.html's srSubmitBtn handler — and echoed back
// unchanged by the worker). Records without an id (older/malformed data) fall
// back to a composite key of vehicle+fastener name+torque+notes. On a key
// collision, the local record wins and the remote one is dropped: local
// storage is the always-present, immediately-fresh copy for the current
// device (e.g. right after a submit and before the worker round-trip
// resolves), so this never overwrites or discards a local record in favor of
// a remote one. This is deliberately conservative de-dupe, not last-write-wins.

function selfReportDedupeKey(record) {
  if (record && record.id) return `id:${record.id}`;
  const vehicleId = (record && record.vehicleId) || '';
  const fastenerName = ((record && record.fastenerName) || '').toLowerCase();
  const torqueValue = (record && record.torqueValue) || '';
  const sourceNotes = (record && record.sourceNotes) || '';
  return `k:${vehicleId}|${fastenerName}|${torqueValue}|${sourceNotes}`;
}

function mergeSelfReports(localRecords, remoteRecords) {
  const local = Array.isArray(localRecords) ? localRecords : [];
  const remote = Array.isArray(remoteRecords) ? remoteRecords : [];
  const seen = new Set(local.map(selfReportDedupeKey));
  const merged = local.slice();
  for (const rec of remote) {
    const key = selfReportDedupeKey(rec);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(rec);
  }
  return merged;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mergeSelfReports, selfReportDedupeKey };
}
