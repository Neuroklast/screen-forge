/** Pure, scene-time driven choreography. No timers, randomness or external I/O. */
export type SequenceId =
  "boot" | "intrusion" | "decrypt" | "cluster" | "biometric" | "reconstruct" | "operation";
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
    subtitle: "Synthetic route discovery and access choreography",
    code: "NET / 07",
    phases: [
      {
        name: "Passive signal collection",
        detail: "Separating a weak carrier from synthetic background traffic",
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
          "Aligning fictional session fragments inside the isolated model",
        duration: 23,
        channel: "SIG.11",
        mode: "rings",
        logs: [
          "Fragment boundaries detected",
          "Handshake geometry aligned",
          "Session envelope fitted",
          "Synthetic peer accepted",
        ],
      },
      {
        name: "Access window alignment",
        detail:
          "Matching a simulated timing window to the local reference clock",
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
        detail: "Revealing accessible fictional data partitions",
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
        detail: "Holding the simulated connection for operator review",
        duration: 13,
        channel: "LNK.07",
        mode: "spectrum",
        logs: [
          "Transient paths retired",
          "Signal confidence stabilized",
          "Local record written",
          "Simulation complete",
        ],
      },
    ],
  },
  {
    id: "decrypt",
    name: "Archive recovery",
    subtitle: "Fragment alignment and fictional data reconstruction",
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
          "Projecting the simulated archive into a spectral density field",
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
          "Rebuilding fictional directory references and record associations",
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
          "Binding three fictional collections to a shared coordinate space",
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
        detail: "Writing a fictional case packet for the operator",
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
    subtitle: "Fictional fingerprint topology and identity matching",
    code: "BIO / 04",
    phases: [
      {
        name: "Sensor normalization",
        detail:
          "Removing simulated pressure variation from the captured contact field",
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
          "Following ridge direction through the synthetic fingerprint image",
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
        detail: "Matching fictional bifurcations to a local operator profile",
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
        detail: "Reconciling the simulated profile with the operator manifest",
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
];

// One continuous time axis keeps the entire boot > intrusion > exception story seekable.
sequences.push({id:'operation',name:'Perimeter breach',subtitle:'Cold start → relay intrusion → containment exception',code:'OP / 07',phases:[
 ...sequences.find(s=>s.id==='boot')!.phases,
 ...sequences.find(s=>s.id==='intrusion')!.phases,
 {name:'Containment exception',detail:'A synthetic session mismatch triggers the operator warning state',duration:18,channel:'ALERT.07',mode:'spectrum',logs:['Session discontinuity detected','Archive corridor isolated','Operator acknowledgement required','Containment exception latched']},
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
