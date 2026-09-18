import { useState } from 'react'
import { X } from 'lucide-react'
import { useQrScanner } from '@/hooks/useQrScanner'

/**
 * Full-screen camera scanner overlay used to confirm attendance presence.
 * Pass `onScan` to receive the decoded QR string (attendance token).
 * A manual input is also available in case the camera/external scanner
 * cannot read the QR — the user can type the code shown on the terminal.
 */
export function QrScannerModal({ onScan, onClose, title }: { onScan: (data: string) => void; onClose: () => void; title: string }) {
  const { videoRef, error } = useQrScanner(onScan, true)
  const [code, setCode] = useState('')
  const [useManual, setUseManual] = useState(false)

  const submitCode = () => {
    const value = code.trim()
    if (!value) return
    onScan(value)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{title}</span>
          <button onClick={onClose} style={{ padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', color: '#fff', display: 'inline-flex' }}>
            <X size={16} />
          </button>
        </div>

        {!useManual && (
          <div style={{ width: '100%', aspectRatio: '1', position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#0f172a', border: '2px dashed rgba(255,255,255,0.35)' }}>
            <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '13px', color: '#cbd5e1', textAlign: 'center', padding: '16px' }}>Scan the QR code shown on the attendance terminal</span>
            </div>
          </div>
        )}

        {!useManual ? (
          error ? (
            <p style={{ fontSize: '12px', color: '#fca5a5', textAlign: 'center', margin: 0 }}>{error}</p>
          ) : (
            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>Align the QR code within the frame to confirm your presence.</p>
          )
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>Enter code manually</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitCode() }}
              placeholder="Paste the code shown on the terminal"
              style={{ width: '100%', height: '46px', padding: '0 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.3)', background: '#0f172a', color: '#fff', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
            />
            <button
              onClick={submitCode}
              disabled={!code.trim()}
              style={{ width: '100%', height: '44px', borderRadius: '10px', border: 'none', fontSize: '14px', fontWeight: 600, color: 'var(--text-on-dark)', background: 'var(--bg-nav-active)', cursor: code.trim() ? 'pointer' : 'not-allowed', opacity: code.trim() ? 1 : 0.5 }}
            >
              Confirm presence
            </button>
          </div>
        )}

        <button
          onClick={() => { setUseManual(v => !v); setCode('') }}
          style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.12)' }}
        >
          {useManual ? 'Use camera instead' : 'Manual code entry'}
        </button>
      </div>
    </div>
  )
}
