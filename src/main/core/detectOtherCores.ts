import axios from 'axios'
import { readdirSync } from 'fs'
import { mihomoIpcPath } from '../utils/dirs'
import { getControledMihomoConfig } from '../config'
import { t } from '../utils/i18n'

// Detect OTHER running mihomo cores without relying on the process/binary name (which a
// fork or a user can rename). A core is identified purely by a positive response from its
// controller `/version` endpoint — the API answer is the fingerprint. We look in two
// places:
//   1. The app-family controller IPC convention (see utils/dirs.ts mihomoIpcPath):
//        Windows:  \\.\pipe\<packageName>\mihomo
//        unix:     /tmp/<packageName>-mihomo-*.sock
//      Every fork of this app exposes such an endpoint, so enumerating them catches any
//      sibling fork regardless of its packageName — while excluding our own endpoint.
//   2. Foreign clients (Clash Verge / Mihomo Party / FlClash …) that expose a TCP
//      external-controller, conventionally 127.0.0.1:9090.

export interface DetectedCore {
  /** Human-readable endpoint: pipe name, socket path, or host:port. */
  endpoint: string
  transport: 'pipe' | 'unix' | 'tcp'
  version: string
}

const WINDOWS_PIPE_DIR = '\\\\.\\pipe\\'
const PROBE_TIMEOUT = 800
const COMMON_TCP_CONTROLLERS = ['127.0.0.1:9090']

// mihomo's /version returns e.g. { meta: true, version: "..." }. Accept anything with that
// shape; a positive response is the fingerprint, independent of the binary name.
function extractVersion(data: unknown): string | null {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if ('version' in obj || 'meta' in obj) {
      return typeof obj.version === 'string' ? obj.version : 'unknown'
    }
  }
  return null
}

// GET /version over a named pipe / unix socket. Returns the version on a valid mihomo
// response, or null on any failure (no core there). Uses a throwaway request so it never
// touches the shared axios singleton in mihomoApi.ts.
async function probeSocket(socketPath: string): Promise<string | null> {
  try {
    const res = await axios.get('/version', {
      baseURL: 'http://localhost',
      socketPath,
      timeout: PROBE_TIMEOUT
    })
    return extractVersion(res.data)
  } catch {
    return null
  }
}

async function probeTcp(hostPort: string): Promise<string | null> {
  try {
    const res = await axios.get(`http://${hostPort}/version`, { timeout: PROBE_TIMEOUT })
    return extractVersion(res.data)
  } catch {
    return null
  }
}

function normalizeHostPort(addr: string): string {
  const trimmed = addr.trim()
  if (!trimmed) return ''
  const parts = trimmed.split(':')
  const port = parts[parts.length - 1]
  let host = parts.slice(0, -1).join(':') || '127.0.0.1'
  if (host === '0.0.0.0' || host === '*' || host === '[::]' || host === '') host = '127.0.0.1'
  return `${host}:${port}`
}

// Family controller endpoints currently present on the machine, excluding our own.
function familyEndpoints(): { socketPath: string; transport: 'pipe' | 'unix'; label: string }[] {
  const self = mihomoIpcPath()
  const out: { socketPath: string; transport: 'pipe' | 'unix'; label: string }[] = []

  if (process.platform === 'win32') {
    let entries: string[] = []
    try {
      // The Windows pipe namespace is enumerable; names like "clashapp\mihomo" come back
      // as single leaf names (the backslash is part of the name, not a directory).
      entries = readdirSync(WINDOWS_PIPE_DIR)
    } catch {
      entries = []
    }
    for (const entry of entries) {
      if (!/\\mihomo$/i.test(entry)) continue
      const socketPath = WINDOWS_PIPE_DIR + entry
      if (socketPath.toLowerCase() === self.toLowerCase()) continue
      out.push({ socketPath, transport: 'pipe', label: WINDOWS_PIPE_DIR + entry })
    }
  } else {
    let entries: string[] = []
    try {
      entries = readdirSync('/tmp')
    } catch {
      entries = []
    }
    for (const entry of entries) {
      if (!/-mihomo-[^/]*\.sock$/.test(entry)) continue
      const socketPath = `/tmp/${entry}`
      if (socketPath === self) continue
      out.push({ socketPath, transport: 'unix', label: socketPath })
    }
  }
  return out
}

async function foreignTcpCores(): Promise<DetectedCore[]> {
  let ownController = ''
  try {
    const cfg = await getControledMihomoConfig()
    ownController = normalizeHostPort(cfg['external-controller'] || '')
  } catch {
    // ignore — treat as no own TCP controller
  }

  const results = await Promise.all(
    COMMON_TCP_CONTROLLERS.map(async (cand): Promise<DetectedCore | null> => {
      // Skip our own configured external-controller so we don't flag ourselves.
      if (ownController && normalizeHostPort(cand) === ownController) return null
      const version = await probeTcp(cand)
      return version ? { endpoint: cand, transport: 'tcp', version } : null
    })
  )
  return results.filter((r): r is DetectedCore => r !== null)
}

/** Returns every OTHER mihomo core currently reachable, identified by its /version API. */
export async function detectForeignCores(): Promise<DetectedCore[]> {
  const family = familyEndpoints()
  const familyResults = await Promise.all(
    family.map(async (e): Promise<DetectedCore | null> => {
      const version = await probeSocket(e.socketPath)
      return version ? { endpoint: e.label, transport: e.transport, version } : null
    })
  )
  const tcp = await foreignTcpCores()
  return [...familyResults.filter((r): r is DetectedCore => r !== null), ...tcp]
}

export interface ForeignCoreWarning {
  title: string
  message: string
  /** Real client names of the other running cores (e.g. "clashapp"), for display. */
  clients: string[]
}

// Pull the human-facing client name out of a controller endpoint. Forks of this app expose a
// branded pipe/socket whose first segment is the packageName (\\.\pipe\clashapp\mihomo →
// "clashapp", /tmp/clashapp-mihomo-*.sock → "clashapp"); a third-party TCP controller has no
// such name, so we fall back to its host:port.
function clientName(core: DetectedCore): string {
  if (core.transport === 'pipe') {
    const m = /\\pipe\\(.+)\\mihomo$/i.exec(core.endpoint)
    if (m) return m[1]
  } else if (core.transport === 'unix') {
    const base = core.endpoint.split('/').pop() || core.endpoint
    const m = /^(.+?)-mihomo-/.exec(base)
    if (m) return m[1]
  }
  return core.endpoint
}

// Build the user-facing warning payload (composed with the main-process locale), or null
// when no other core is running. The message is a plain sentence; the resolved client names
// travel separately so each surface can decide whether to show them. Never throws.
async function buildForeignCoreWarning(): Promise<ForeignCoreWarning | null> {
  try {
    const found = await detectForeignCores()
    if (found.length === 0) return null
    return {
      title: t('tray.foreignCoreTitle'),
      message: t('tray.foreignCoreMessage'),
      clients: Array.from(new Set(found.map(clientName)))
    }
  } catch {
    return null
  }
}

// Entry point used both by the renderer (boot-time pull, once it has mounted) and by the
// VPN-enable gate in patchControledMihomoConfig (to decide whether to bring TUN up). Returns
// the warning payload when another core is reachable, or null. Never throws.
export async function getForeignCoreWarning(): Promise<ForeignCoreWarning | null> {
  return buildForeignCoreWarning()
}
