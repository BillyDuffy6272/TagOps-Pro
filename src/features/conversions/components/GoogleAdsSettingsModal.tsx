import { useState, type FormEvent } from 'react'
import { GOOGLE_ADS_CONVERSION_ID_PATTERN, updateContainerGoogleAdsId } from '../api/conversions'
import type { Container } from '../types'
import Modal from '../../../components/Modal'

interface Props {
  container: Container
  onClose: () => void
  onSaved: (container: Container) => void
}

const FIELD_LABEL = 'text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase'
const FIELD_INPUT =
  'rounded-md border border-border bg-surface px-2.5 py-2 font-sans text-[13px] text-text-primary transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent'

export default function GoogleAdsSettingsModal({ container, onClose, onSaved }: Props) {
  const [conversionId, setConversionId] = useState(container.google_ads_conversion_id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = conversionId.trim()
    if (trimmed && !GOOGLE_ADS_CONVERSION_ID_PATTERN.test(trimmed)) {
      setError('Conversion ID must look like AW-123456789 (find it under Goals → Conversions in Google Ads).')
      return
    }

    setSaving(true)
    try {
      const updated = await updateContainerGoogleAdsId(container.id, trimmed || null)
      onSaved(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Google Ads settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Modal
        title="Google Ads settings"
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-border bg-transparent px-4 py-1.5 text-[13px] font-semibold text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-1.5 text-[13px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {error && (
          <div className="rounded-md border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger-text">{error}</div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>Container</span>
          <div className="rounded-md border border-border-subtle bg-surface-sunken px-2.5 py-2 text-[13px] text-text-tertiary">
            {container.name}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL} htmlFor="google-ads-conversion-id">Google Ads conversion ID</label>
          <input
            id="google-ads-conversion-id"
            className={`${FIELD_INPUT} font-mono`}
            value={conversionId}
            onChange={e => setConversionId(e.target.value)}
            placeholder="AW-123456789"
            pattern="AW-[0-9]{6,}"
            title="Format: AW- followed by the numeric account ID"
          />
          <p className="m-0 text-[12px] leading-relaxed text-text-faint">
            The account-level ID Google Ads gives every conversion action (the part before the slash
            in <code className="font-mono">AW-123456789/AbC-D_efG</code>). It's shared by all conversion
            events in this container. Leave empty to unlink.
          </p>
        </div>
      </Modal>
    </form>
  )
}
