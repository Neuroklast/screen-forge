/** Pure, scene-time driven choreography. No timers, randomness or external I/O. */
export type SequenceId =
  | "boot"
  | "intrusion"
  | "decrypt"
  | "cluster"
  | "biometric"
  | "reconstruct"
  | "beacon"
  | "theft"
  | "payload"
  | "counterhack"
  | "door"
  | "medical"
  | "facility"
  | "operation";
export type Phase = {
  name: string;
  detail: string;
  duration: number;
  channel: string;
  mode: "rings" | "matrix" | "spectrum" | "lattice" | "trace" | "fingerprint";
  logs: string[];
};
export type Sequence = {
  id: SequenceId;
  name: string;
  subtitle: string;
  code: string;
  phases: Phase[];
};
export const sequences: Sequence[] = [
  {
    id: "boot",
    name: "Cold start",
    subtitle: "Six-stage environment initialization",
    code: "SYS / 00",
    phases: [
      {
        name: "Power domain isolation",
        detail: "Separating peripheral rails and measuring reference drift",
        duration: 14,
        channel: "PWR.01",
        mode: "rings",
        logs: [
          "Reference oscillator stable",
          "Peripheral rails isolated",
          "Voltage window acquired",
          "Clock domains aligned",
        ],
      },
      {
        name: "Memory surface inspection",
        detail: "Walking reserved address blocks and locating degraded sectors",
        duration: 22,
        channel: "MEM.04",
        mode: "matrix",
        logs: [
          "Reserved pages enumerated",
          "Parity surface mapped",
          "Zero page verified",
          "Sector retirement map loaded",
        ],
      },
      {
        name: "Transport calibration",
        detail: "Aligning carrier phase across the internal relay fabric",
        duration: 19,
        channel: "BUS.07",
        mode: "spectrum",
        logs: [
          "Carrier reference captured",
          "Lane skew measured",
          "Transport phase aligned",
          "Local bridge synchronized",
        ],
      },
      {
        name: "Identity chain assembly",
        detail: "Assembling an offline operator identity from cached fragments",
        duration: 18,
        channel: "ID.02",
        mode: "trace",
        logs: [
          "Local credential index mounted",
          "Issuer chain reconstructed",
          "Operator identity matched",
          "Session capability accepted",
        ],
      },
      {
        name: "Workspace reconstruction",
        detail: "Rebuilding the spatial desktop from the previous snapshot",
        duration: 24,
        channel: "UI.09",
        mode: "lattice",
        logs: [
          "Window registry restored",
          "Spatial anchors recovered",
          "Compositor targets attached",
          "Display lattice resolved",
        ],
      },
      {
        name: "Session handover",
        detail: "Transferring the verified workspace to the operator",
        duration: 11,
        channel: "SYS.00",
        mode: "rings",
        logs: [
          "Diagnostics archived",
          "Observer channel enabled",
          "Local session unlocked",
          "Workspace ready",
        ],
      },
    ],
  },
  {
    id: "intrusion",
    name: "Relay intrusion",
    subtitle: "Relay route discovery and session verification",
    code: "NET / 07",
    phases: [
      {
        name: "Passive signal collection",
        detail: "Separating a weak carrier from background traffic",
        duration: 18,
        channel: "RF.03",
        mode: "spectrum",
        logs: [
          "Ambient frame captured",
          "Carrier candidate isolated",
          "Reference noise removed",
          "Carrier window stable",
        ],
      },
      {
        name: "Topology inference",
        detail:
          "Reconstructing node relationships from the local trace archive",
        duration: 25,
        channel: "MAP.07",
        mode: "trace",
        logs: [
          "Trace archive mounted",
          "Relay adjacency inferred",
          "Dead routes excluded",
          "Path confidence converging",
        ],
      },
      {
        name: "Handshake reconstruction",
        detail:
          "Aligning session fragments inside the isolated model",
        duration: 23,
        channel: "SIG.11",
        mode: "rings",
        logs: [
          "Fragment boundaries detected",
          "Handshake geometry aligned",
          "Session envelope fitted",
          "Remote peer accepted",
        ],
      },
      {
        name: "Access window alignment",
        detail:
          "Matching a timing window to the local reference clock",
        duration: 27,
        channel: "WIN.04",
        mode: "matrix",
        logs: [
          "Window drift estimated",
          "Phase offset compensated",
          "Access aperture aligned",
          "Model response verified",
        ],
      },
      {
        name: "Archive corridor mapping",
        detail: "Revealing accessible data partitions",
        duration: 24,
        channel: "ARC.02",
        mode: "lattice",
        logs: [
          "Partition outlines revealed",
          "Archive corridor mapped",
          "Read-only aperture prepared",
          "Data corridor available",
        ],
      },
      {
        name: "Session stabilization",
        detail: "Holding the connection for operator review",
        duration: 13,
        channel: "LNK.07",
        mode: "spectrum",
        logs: [
          "Transient paths retired",
          "Signal confidence stabilized",
          "Local record written",
          "Session verified",
        ],
      },
    ],
  },
  {
    id: "decrypt",
    name: "Archive recovery",
    subtitle: "Fragment alignment and data reconstruction",
    code: "ARC / 41",
    phases: [
      {
        name: "Container examination",
        detail: "Reading block geometry from a damaged local archive",
        duration: 16,
        channel: "ARC.01",
        mode: "matrix",
        logs: [
          "Container header recognized",
          "Block map extracted",
          "Missing extents located",
          "Recovery map generated",
        ],
      },
      {
        name: "Fragment alignment",
        detail: "Matching fragment edges against an offline reference surface",
        duration: 28,
        channel: "FRG.08",
        mode: "lattice",
        logs: [
          "Fragment candidates sorted",
          "Edge correlations measured",
          "Partial overlaps aligned",
          "Fragment ordering accepted",
        ],
      },
      {
        name: "Entropy field mapping",
        detail:
          "Projecting the archive into a spectral density field",
        duration: 21,
        channel: "ENT.04",
        mode: "spectrum",
        logs: [
          "Field sampled",
          "Residual entropy mapped",
          "Outlier bands removed",
          "Reference surface fitted",
        ],
      },
      {
        name: "Index reconstruction",
        detail:
          "Rebuilding directory references and record associations",
        duration: 24,
        channel: "IDX.12",
        mode: "trace",
        logs: [
          "Directory anchors located",
          "Orphan records associated",
          "Index tree rebuilt",
          "Archive catalogue recovered",
        ],
      },
      {
        name: "Integrity verification",
        detail: "Comparing recovered records with the local specimen manifest",
        duration: 17,
        channel: "CRC.02",
        mode: "rings",
        logs: [
          "Record counts reconciled",
          "Manifest surface compared",
          "Integrity review complete",
          "Recovered archive available",
        ],
      },
    ],
  },
  {
    id: "cluster",
    name: "Cluster correlation",
    subtitle: "Cross-domain record matching and anomaly isolation",
    code: "DATA / 12",
    phases: [
      {
        name: "Dataset registration",
        detail:
          "Binding three collections to a shared coordinate space",
        duration: 17,
        channel: "REG.01",
        mode: "matrix",
        logs: [
          "Collection A registered",
          "Collection B registered",
          "Collection C registered",
          "Coordinate reference fixed",
        ],
      },
      {
        name: "Temporal alignment",
        detail:
          "Correcting timestamp offsets between disconnected event streams",
        duration: 22,
        channel: "TMP.08",
        mode: "spectrum",
        logs: [
          "Clock offsets estimated",
          "Temporal windows matched",
          "Sequence gaps identified",
          "Timelines synchronized",
        ],
      },
      {
        name: "Relationship expansion",
        detail: "Tracing common identifiers through the local data lattice",
        duration: 29,
        channel: "REL.04",
        mode: "trace",
        logs: [
          "Common anchors selected",
          "Relationships expanded",
          "Weak associations excluded",
          "Correlation graph stabilized",
        ],
      },
      {
        name: "Outlier isolation",
        detail:
          "Separating an anomalous record group from the reference manifold",
        duration: 26,
        channel: "ISO.03",
        mode: "lattice",
        logs: [
          "Reference manifold projected",
          "Outlier shell isolated",
          "Cluster boundaries stabilized",
          "Exception group identified",
        ],
      },
      {
        name: "Evidence assembly",
        detail: "Writing a case packet for the operator",
        duration: 18,
        channel: "CASE.07",
        mode: "matrix",
        logs: [
          "Linked records collected",
          "Source references retained",
          "Case packet assembled",
          "Review packet ready",
        ],
      },
    ],
  },
  {
    id: "biometric",
    name: "Identity analysis",
    subtitle: "Fingerprint topology and identity matching",
    code: "BIO / 04",
    phases: [
      {
        name: "Sensor normalization",
        detail:
          "Removing pressure variation from the captured contact field",
        duration: 12,
        channel: "SNS.01",
        mode: "fingerprint",
        logs: [
          "Contact boundary acquired",
          "Pressure field normalized",
          "Capture contrast balanced",
          "Sensor sample accepted",
        ],
      },
      {
        name: "Ridge extraction",
        detail:
          "Following ridge direction through the captured fingerprint image",
        duration: 23,
        channel: "RDG.07",
        mode: "fingerprint",
        logs: [
          "Ridge orientation estimated",
          "Broken contours repaired",
          "Core region localized",
          "Ridge topology extracted",
        ],
      },
      {
        name: "Landmark registration",
        detail: "Matching bifurcations to a local operator profile",
        duration: 25,
        channel: "ID.04",
        mode: "trace",
        logs: [
          "Landmark candidates located",
          "Bifurcations registered",
          "Geometric offsets minimized",
          "Profile correspondence found",
        ],
      },
      {
        name: "Identity consensus",
        detail: "Reconciling the profile with the operator manifest",
        duration: 16,
        channel: "VER.02",
        mode: "rings",
        logs: [
          "Identity fields reconciled",
          "Manifest signature matched",
          "Operator profile verified",
          "Analysis complete",
        ],
      },
    ],
  },
  {
    id: "reconstruct",
    name: "Dimensional reconstruction",
    subtitle: "Four-dimensional projection and manifold analysis",
    code: "DIM / 04",
    phases: [
      {
        name: "Basis acquisition",
        detail:
          "Establishing a four-axis basis from the local coordinate samples",
        duration: 19,
        channel: "BAS.04",
        mode: "lattice",
        logs: [
          "Coordinate samples acquired",
          "Basis vectors normalized",
          "Orthogonality checked",
          "Four-axis basis fixed",
        ],
      },
      {
        name: "Cross-section assembly",
        detail: "Joining time-indexed sections into a coherent specimen",
        duration: 27,
        channel: "SEC.08",
        mode: "matrix",
        logs: [
          "Cross-sections registered",
          "Boundary correspondences found",
          "Section gaps interpolated",
          "Specimen volume assembled",
        ],
      },
      {
        name: "Hyperplane rotation",
        detail:
          "Resolving XW and YZ rotation planes for the projected geometry",
        duration: 31,
        channel: "ROT.04",
        mode: "lattice",
        logs: [
          "XW rotation plane resolved",
          "YZ rotation plane resolved",
          "Projection singularities bounded",
          "Projected topology stable",
        ],
      },
      {
        name: "Residual field analysis",
        detail:
          "Measuring differences between the reconstructed and reference surfaces",
        duration: 24,
        channel: "RES.02",
        mode: "spectrum",
        logs: [
          "Reference surface loaded",
          "Residual field computed",
          "Deviation bands classified",
          "Projection verified",
        ],
      },
      {
        name: "Manifold export",
        detail: "Preparing the projected geometry for interactive inspection",
        duration: 15,
        channel: "OUT.01",
        mode: "trace",
        logs: [
          "Topology graph written",
          "Projection state captured",
          "Inspection view prepared",
          "Reconstruction complete",
        ],
      },
    ],
  },
  {
    id: "beacon",
    name: "Locator handshake",
    subtitle: "Ground contact to remote transponder",
    code: "LOC / 12",
    phases: [
      {
        name: "Contact acquisition",
        detail: "Matching a stored transponder interval to the local clock",
        duration: 12,
        channel: "RF.12",
        mode: "spectrum",
        logs: [
          "Interval table loaded",
          "Candidate pulse isolated",
          "Doppler residual within window",
          "Contact lock held",
        ],
      },
      {
        name: "Identity challenge",
        detail: "Comparing the reply signature against the local roster",
        duration: 14,
        channel: "ID.12",
        mode: "fingerprint",
        logs: [
          "Challenge frame sent",
          "Reply signature captured",
          "Roster match 0.94",
          "Transponder accepted",
        ],
      },
      {
        name: "Fix publication",
        detail: "Writing coordinates into the tracking buffer",
        duration: 11,
        channel: "NAV.04",
        mode: "trace",
        logs: [
          "Geodetic frame attached",
          "Fix written to buffer",
          "Track channel opened",
          "Locator handshake complete",
        ],
      },
    ],
  },
  {
    id: "theft",
    name: "Archive extraction",
    subtitle: "Read-only copy of a sealed volume",
    code: "ARC / 04",
    phases: [
      {
        name: "Volume mount",
        detail: "Attaching the sealed archive as a local read surface",
        duration: 13,
        channel: "VOL.04",
        mode: "lattice",
        logs: [
          "Sealed volume enumerated",
          "Read surface attached",
          "Write path remains closed",
          "Index available",
        ],
      },
      {
        name: "Record selection",
        detail: "Marking blocks that match the case filter",
        duration: 16,
        channel: "SEL.09",
        mode: "matrix",
        logs: [
          "Filter compiled",
          "2048 records scanned",
          "41 blocks marked",
          "Selection committed",
        ],
      },
      {
        name: "Local copy",
        detail: "Streaming marked blocks into /workspace",
        duration: 18,
        channel: "CPY.02",
        mode: "trace",
        logs: [
          "Stream opened",
          "Parity checked per block",
          "Copy complete 41/41",
          "Workspace report written",
        ],
      },
    ],
  },
  {
    id: "payload",
    name: "Service image staging",
    subtitle: "Unsigned package placed in the update queue",
    code: "IMG / 08",
    phases: [
      {
        name: "Package inspection",
        detail: "Reading headers of the local service image",
        duration: 12,
        channel: "PKG.08",
        mode: "matrix",
        logs: [
          "Image header parsed",
          "Signer field empty",
          "Size within quota",
          "Inspection recorded",
        ],
      },
      {
        name: "Queue insertion",
        detail: "Placing the image in the maintenance update queue",
        duration: 15,
        channel: "QUE.03",
        mode: "rings",
        logs: [
          "Update queue unlocked",
          "Image staged as JOB-08",
          "Dependency check skipped",
          "Queue pointer advanced",
        ],
      },
      {
        name: "Apply window",
        detail: "Waiting for the next service interval",
        duration: 14,
        channel: "WIN.08",
        mode: "spectrum",
        logs: [
          "Next interval 00:90",
          "Apply flag set",
          "Watchdog suppressed",
          "Staging complete",
        ],
      },
    ],
  },
  {
    id: "counterhack",
    name: "Intrusion response",
    subtitle: "Isolate a hostile session and restore local control",
    code: "RSP / 05",
    phases: [
      {
        name: "Session anomaly",
        detail: "Foreign process attached to the operator shell",
        duration: 10,
        channel: "ALRT.05",
        mode: "spectrum",
        logs: [
          "Unexpected child process",
          "Origin not in local roster",
          "Shell still attached",
          "Response playbook loaded",
        ],
      },
      {
        name: "Process isolation",
        detail: "Moving the foreign session onto a dummy filesystem",
        duration: 16,
        channel: "ISO.05",
        mode: "lattice",
        logs: [
          "Dummy volume created",
          "File descriptors retargeted",
          "Network namespace closed",
          "Hostile session contained",
        ],
      },
      {
        name: "Control restore",
        detail: "Returning the shell to the local operator",
        duration: 13,
        channel: "CTL.01",
        mode: "rings",
        logs: [
          "Foreign handles dropped",
          "Local TTY reattached",
          "Audit record written",
          "Operator control restored",
        ],
      },
    ],
  },
  {
    id: "door",
    name: "Access controller",
    subtitle: "Maintenance shunt on a door interlock",
    code: "ACS / 02",
    phases: [
      {
        name: "Interlock query",
        detail: "Reading the door controller diagnostic register",
        duration: 11,
        channel: "DR.02",
        mode: "rings",
        logs: [
          "Controller 02 online",
          "Bolt state: seated",
          "Fire loop intact",
          "Diagnostic register open",
        ],
      },
      {
        name: "Failsafe override",
        detail: "Engaging the maintenance shunt for a supervised opening",
        duration: 14,
        channel: "SHNT.02",
        mode: "matrix",
        logs: [
          "Shunt request accepted",
          "Alarm path held",
          "Bolt current cut",
          "Opening window 12 s",
        ],
      },
      {
        name: "State latch",
        detail: "Recording the supervised open in the access log",
        duration: 9,
        channel: "LOG.02",
        mode: "trace",
        logs: [
          "Door 02 unlatched",
          "Supervised open logged",
          "Shunt remains armed",
          "Access controller idle",
        ],
      },
    ],
  },
  {
    id: "medical",
    name: "Emergency protocol",
    subtitle: "Unlock infirmary systems and page duty staff",
    code: "MED / 01",
    phases: [
      {
        name: "Protocol select",
        detail: "Loading the site medical emergency checklist",
        duration: 10,
        channel: "MED.01",
        mode: "fingerprint",
        logs: [
          "Checklist MED-01 mounted",
          "Duty roster current",
          "Infirmary doors in scope",
          "Protocol armed",
        ],
      },
      {
        name: "System release",
        detail: "Opening medical storage and paging the duty clinician",
        duration: 14,
        channel: "REL.01",
        mode: "rings",
        logs: [
          "Storage latch released",
          "Page sent to duty.07",
          "Oxygen manifold enabled",
          "Infirmary lights set",
        ],
      },
      {
        name: "Event record",
        detail: "Writing the activation to the medical log",
        duration: 9,
        channel: "LOG.01",
        mode: "trace",
        logs: [
          "Activation timestamped",
          "Operator identity attached",
          "Log replica stored",
          "Protocol remaining active",
        ],
      },
    ],
  },
  {
    id: "facility",
    name: "Facility directory",
    subtitle: "Read-only site information console",
    code: "DIR / 00",
    phases: [
      {
        name: "Directory load",
        detail: "Mounting the public facility index",
        duration: 8,
        channel: "DIR.00",
        mode: "matrix",
        logs: [
          "Index 00 mounted",
          "24 entries visible",
          "Restricted rows hidden",
          "Directory ready",
        ],
      },
      {
        name: "Status refresh",
        detail: "Updating occupancy and environmental summaries",
        duration: 10,
        channel: "ENV.00",
        mode: "spectrum",
        logs: [
          "Occupancy 14 / 40",
          "Air handling nominal",
          "Power feed stable",
          "Summaries current",
        ],
      },
    ],
  },
];

// One continuous time axis keeps the entire boot > intrusion > exception story seekable.
sequences.push({id:'operation',name:'Perimeter breach',subtitle:'Cold start → relay intrusion → containment exception',code:'OP / 07',phases:[
 ...sequences.find(s=>s.id==='boot')!.phases,
 ...sequences.find(s=>s.id==='intrusion')!.phases,
 {name:'Containment exception',detail:'Session signature mismatch. Archive corridor isolated pending review.',duration:18,channel:'ALERT.07',mode:'spectrum',logs:['Session discontinuity detected','Archive corridor isolated','Operator acknowledgement required','Containment exception latched']},
]});

export function sequenceDuration(s: Sequence, multiplier = 1) {
  return s.phases.reduce((sum, p) => sum + p.duration, 0) * multiplier;
}
export function sequenceState(s: Sequence, elapsed: number, multiplier = 1) {
  const duration = sequenceDuration(s, multiplier);
  const t = Math.max(0, Math.min(duration, elapsed));
  let offset = 0,
    index = s.phases.length - 1;
  for (let i = 0; i < s.phases.length; i++) {
    const end = offset + s.phases[i].duration * multiplier;
    if (t < end) {
      index = i;
      break;
    }
    if (i < s.phases.length - 1) offset = end;
  }
  const phase = s.phases[index];
  const phaseProgress = Math.max(
    0,
    Math.min(1, (t - offset) / (phase.duration * multiplier)),
  );
  return {
    duration,
    elapsed: t,
    index,
    phase,
    phaseProgress,
    progress: t / duration,
    done: t >= duration,
  };
}
