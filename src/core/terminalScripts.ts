export type TerminalStep = { command: string; outputs: string[]; hint: string };
export type TerminalScript = {
  id: string;
  name: string;
  goal: string;
  prompt: string;
  successText: string;
  steps: TerminalStep[];
};

// Fictional command sequences for the terminal scene. Every hostname, token and
// output is invented; there is no real infrastructure, credential or procedure.
export const terminalScripts: TerminalScript[] = [
  {
    id: "auth-bypass",
    name: "Relay auth bypass",
    goal: "Bypass login",
    prompt: "relay-07",
    successText: "Access bypassed.",
    steps: [
      {
        command: "status",
        outputs: [
          "relay-07 · link established",
          "session: guest / restricted",
          "auth service: legacy",
        ],
        hint: "Start with `status`.",
      },
      {
        command: "scan --local",
        outputs: [
          "ports: 3 open",
          "service: auth v2.1",
          "note: default token policy",
        ],
        hint: "Scan the local node: `scan --local`.",
      },
      {
        command: "inspect auth",
        outputs: [
          "auth service v2.1",
          "weakness: default maintenance token",
          "token id: 07-RELAY",
        ],
        hint: "Inspect the auth service.",
      },
      {
        command: "login --token 07-RELAY",
        outputs: ["token accepted", "elevating session ...", "ACCESS GRANTED"],
        hint: "Use the maintenance token to log in.",
      },
    ],
  },
  {
    id: "camera-loop",
    name: "Camera loop injection",
    goal: "Loop sector camera",
    prompt: "cam-04",
    successText: "Camera loop active.",
    steps: [
      {
        command: "cams --list",
        outputs: [
          "cam-04 sector 07",
          "feed: h264 / 25 fps",
          "recorder: local ring 72 h",
        ],
        hint: "List the cameras: `cams --list`.",
      },
      {
        command: "cams --probe cam-04",
        outputs: ["firmware 3.4.1", "rtsp auth: shared", "buffer: 8 s"],
        hint: "Probe the target camera.",
      },
      {
        command: "cams --loop cam-04 --window 8s",
        outputs: ["8 s loop injected", "recorder: ring updated", "LIVE LOOP ACTIVE"],
        hint: "Inject the loop with an 8 s window.",
      },
    ],
  },
  {
    id: "door-override",
    name: "Door controller override",
    goal: "Release door 02",
    prompt: "acs-02",
    successText: "Interlock released.",
    steps: [
      {
        command: "acs --status",
        outputs: [
          "acs-02 interlock armed",
          "bolt current 0 %",
          "relock delay 30 s",
        ],
        hint: "Check the controller: `acs --status`.",
      },
      {
        command: "acs --service --enable",
        outputs: [
          "service window open",
          "manual release available",
          "log: maintenance",
        ],
        hint: "Open the service window.",
      },
      {
        command: "acs --release 02 --hold 2s",
        outputs: ["bolt released", "relock armed 30 s", "INTERLOCK OPEN"],
        hint: "Release the bolt.",
      },
    ],
  },
  {
    id: "archive-extract",
    name: "Archive extraction",
    goal: "Recover sector archive",
    prompt: "arc-07",
    successText: "Archive recovered.",
    steps: [
      {
        command: "archive --index",
        outputs: ["blocks: 128", "recoverable: 81.4 %", "missing: 0041"],
        hint: "Read the index: `archive --index`.",
      },
      {
        command: "archive --scan 0041",
        outputs: [
          "parity set found",
          "reconstruction path: 3/3",
          "candidate: sector-07.fragment",
        ],
        hint: "Scan the missing segment.",
      },
      {
        command: "archive --restore 0041 --verify",
        outputs: ["blocks restored", "checksum verified", "ARCHIVE RECOVERED"],
        hint: "Restore and verify.",
      },
    ],
  },
  {
    id: "telemetry-spoof",
    name: "Sensor telemetry spoof",
    goal: "Spoof sensor 04",
    prompt: "sensor-04",
    successText: "Telemetry spoofed.",
    steps: [
      {
        command: "sensor --read 04",
        outputs: ["channel 04 optical", "sample 0.42 m", "rate 60 Hz"],
        hint: "Read the sensor: `sensor --read 04`.",
      },
      {
        command: "sensor --mirror 04 --from 07",
        outputs: [
          "mirror map built",
          "drift compensation on",
          "window 12 s",
        ],
        hint: "Mirror a reference channel.",
      },
      {
        command: "sensor --commit 04",
        outputs: [
          "frame signature rewritten",
          "downstream: nominal",
          "SPOOF COMMITTED",
        ],
        hint: "Commit the spoofed feed.",
      },
    ],
  },
  {
    id: "firmware-rollback",
    name: "Firmware rollback",
    goal: "Roll back relay firmware",
    prompt: "relay-07",
    successText: "Firmware rolled back.",
    steps: [
      {
        command: "fw --version",
        outputs: [
          "relay-07 fw 4.2.0",
          "boot slot: b",
          "rollback image: 4.1.6",
        ],
        hint: "Check the firmware: `fw --version`.",
      },
      {
        command: "fw --verify 4.1.6",
        outputs: ["image signed", "compatibility: ok", "slot b ready"],
        hint: "Verify the rollback image.",
      },
      {
        command: "fw --switch --slot b",
        outputs: ["slot switched", "relay rebooting", "ROLLBACK COMPLETE"],
        hint: "Switch to the rollback slot.",
      },
    ],
  },
];

export function terminalScript(id: string): TerminalScript | undefined {
  return terminalScripts.find((s) => s.id === id);
}
