export type VirtualFile = {
  path: string;
  kind: "text" | "record" | "archive" | "model";
  size: string;
  classification: string;
  content: string;
};
export const files: VirtualFile[] = [
  {
    path: "/system/kernel.manifest",
    kind: "text",
    size: "12.4 KB",
    classification: "SYSTEM",
    content:
      "BLACKLINE / LOCAL ENVIRONMENT\nKernel: BL-09.4\nWorkspace: isolated\nDisplay compositor: attached\nExternal execution: unavailable\n\nSession authority: operator 07. Audit record retained.",
  },
  {
    path: "/system/relay-map.log",
    kind: "text",
    size: "84.2 KB",
    classification: "INTERNAL",
    content:
      "00:00:01 R01 local bridge attached\n00:00:03 R04 reference carrier acquired\n00:00:07 R07 reference route restored\n00:00:11 R12 archive corridor available\n\nPending: investigate discontinuity in sector 07.",
  },
  {
    path: "/personnel/vale.record",
    kind: "record",
    size: "2.8 MB",
    classification: "RESTRICTED",
    content:
      "MARA VALE\nResearch director / Systems geometry\nEmployee record MV-0041\nClearance: level 04\nAssignment: Sector 07\nStatus: active\n\nLast review: identity chain verified. Local access retained.",
  },
  {
    path: "/personnel/ward.record",
    kind: "record",
    size: "1.9 MB",
    classification: "INTERNAL",
    content:
      "ELIAS WARD\nField systems analyst\nEmployee record EW-0093\nClearance: level 03\nAssignment: Relay 12\nStatus: remote\n\nLast review: temporary relay privileges renewed.",
  },
  {
    path: "/personnel/mercer.record",
    kind: "record",
    size: "3.1 MB",
    classification: "SEALED",
    content:
      "N. MERCER\nArchive administrator\nEmployee record NM-0108\nClearance: level 05\nAssignment: Archive 04\nStatus: review\n\nHistorical record contains inconsistent timestamps.",
  },
  {
    path: "/archives/sector-07.fragment",
    kind: "archive",
    size: "418 MB",
    classification: "DAMAGED",
    content:
      "ARCHIVE 07 / FRAGMENT SET\nRecoverable blocks: 81.4%\nManifest references: 2,048\nMissing segment: 0041\n\nRun Archive recovery to reconstruct the archive index.",
  },
  {
    path: "/archives/incident-41.packet",
    kind: "archive",
    size: "72.6 MB",
    classification: "SEALED",
    content:
      "INCIDENT 41 / LOCAL CASE PACKET\nSignal loss recorded at relay 07.\nThree identity records share a discontinuous timestamp.\n\nCross-reference the personnel cluster and transport archive.",
  },
  {
    path: "/datasets/transit.mesh",
    kind: "model",
    size: "26.8 MB",
    classification: "INTERNAL",
    content:
      "TRANSIT MANIFOLD\nDimensions: 4\nVertices: 16\nEdges: 32\nProjection: 4D > 3D > 2D\n\nInteractive XW and YZ rotation is available in the dimensional viewer.",
  },
  {
    path: "/datasets/correlation.index",
    kind: "text",
    size: "6.2 MB",
    classification: "RESTRICTED",
    content:
      "CORRELATION INDEX\nDataset A: personnel\nDataset B: relay events\nDataset C: archive references\n\nCommon anchor: sector 07\nReview status: pending\nConfidence threshold: 0.82",
  },
  {
    path: "/workspace/operator.notes",
    kind: "text",
    size: "4.1 KB",
    classification: "LOCAL",
    content:
      "OPERATOR NOTES\n\n1. Inspect the relay topology.\n2. Recover the sector archive.\n3. Compare personnel timestamps.\n4. Reconstruct the dimensional specimen.\n\nRetain verified reports in /workspace.",
  },
];
export const folders = [
  "/system",
  "/personnel",
  "/archives",
  "/datasets",
  "/workspace",
];
export const people = [
  {
    id: "MV-0041",
    name: "Mara Vale",
    role: "RESEARCH DIRECTOR",
    department: "Systems geometry",
    clearance: "04",
    status: "ACTIVE",
    signal: "98.7",
    file: "/personnel/vale.record",
    notes:
      "Leads the dimensional reconstruction program. Authorized to inspect the sector 07 archive.",
    events: [
      "Identity chain renewed",
      "Archive access recorded",
      "Sector 07 assignment confirmed",
    ],
  },
  {
    id: "EW-0093",
    name: "Elias Ward",
    role: "FIELD SYSTEMS ANALYST",
    department: "Relay operations",
    clearance: "03",
    status: "REMOTE",
    signal: "94.2",
    file: "/personnel/ward.record",
    notes:
      "Maintains remote relay reference maps. Temporary access to transport diagnostics.",
    events: [
      "Relay 12 inspection",
      "Remote session registered",
      "Temporary clearance extended",
    ],
  },
  {
    id: "NM-0108",
    name: "N. Mercer",
    role: "ARCHIVE ADMINISTRATOR",
    department: "Records integrity",
    clearance: "05",
    status: "REVIEW",
    signal: "82.1",
    file: "/personnel/mercer.record",
    notes:
      "Historical timestamps disagree with the local reference. Manual review requested.",
    events: [
      "Timestamp discrepancy found",
      "Archive session isolated",
      "Operator review pending",
    ],
  },
];
