import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../../lib/supabase'
import {
  connectGoogleAds,
  fetchGoogleAdsReport,
  getGoogleAdsConnectionStatus,
  isValidGoogleAdsCustomerId,
  type GoogleAdsConnectionStatus,
  type GoogleAdsReportResult,
} from '../api/googleAds'

// New for ADR-0039. Separate from GoogleAdsSettingsModal (the manual
// AW-XXXXXXXXX snippet ID, restored as-is) — this is a real OAuth
// connection to a Google Ads account, used to pull live conversion data
// via supabase/functions/google-ads-report. Deliberately never added to
// src/pages/Login.tsx's signInWithOAuth call: that call already requests
// tagmanager.readonly for every sign-in, and bundling the Google-restricted
// `adwords` scope into it would risk breaking login entirely for any real
// user not allow-listed as a test user while the app's OAuth consent
// screen is in Google's Testing publishing status (decision-log.md
// ADR-0037). This panel's "Connect Google Ads" button is the only place
// that scope is ever requested, and only when an owner/admin opts in.

const FIELD_LABEL = 'text-[10.5px] font-semibold tracking-[0.07em] text-text-tertiary uppercase'
const FIELD_INPUT =
  'rounded-md border border-border bg-surface px-2.5 py-2 font-sans text-[13px] text-text-primary transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent'

interface Props {
  organisationId: string
  canManage: boolean
  // Set by AppShell right after the "Connect Google Ads" OAuth redirect
  // returns with a fresh session — see AppShell.tsx's `gads=connect`
  // handling. Only ever non-null for the one screen right after that
  // redirect, while the customer ID is still being collected.
  pendingRefreshToken: string | null
  onConsumePendingRefreshToken: () => void
}

export default function GoogleAdsConnectionPanel({
  organisationId,
  canManage,
  pendingRefreshToken,
  onConsumePendingRefreshToken,
}: Props) {
  const [status, setStatus] = useState<GoogleAdsConnectionStatus | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const [customerId, setCustomerId] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  const [report, setReport] = useState<GoogleAdsReportResult | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  useEffect(() => {
    getGoogleAdsConnectionStatus(organisationId)
      .then(setStatus)
      .catch(e => setStatusError(e instanceof Error ? e.message : 'Failed to load Google Ads connection status.'))
  }, [organisationId])

  function handleConnect() {
    // access_type=offline + prompt=consent (already used by Login.tsx's
    // own signInWithOAuth call) is what makes Google issue a refresh
    // token, not just a short-lived access token — required since the
    // report Edge Function needs to call the Ads API long after this
    // browser tab is gone.
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/tagmanager.readonly https://www.googleapis.com/auth/adwords',
        redirectTo: `${window.location.origin}${window.location.pathname}?gads=connect`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  async function handleFinishConnecting(e: FormEvent) {
    e.preventDefault()
    setFinishError(null)

    if (!pendingRefreshToken) return
    const trimmed = customerId.trim()
    if (!isValidGoogleAdsCustomerId(trimmed)) {
      setFinishError('Enter your Google Ads customer ID as 10 digits (e.g. 123-456-7890, found top-right in the Google Ads UI).')
      return
    }

    setFinishing(true)
    try {
      await connectGoogleAds(organisationId, pendingRefreshToken, trimmed)
      onConsumePendingRefreshToken()
      setCustomerId('')
      const updated = await getGoogleAdsConnectionStatus(organisationId)
      setStatus(updated)
    } catch (err) {
      setFinishError(err instanceof Error ? err.message : 'Failed to finish connecting Google Ads.')
    } finally {
      setFinishing(false)
    }
  }

  async function handleLoadReport() {
    setLoadingReport(true)
    setReportError(null)
    try {
      const result = await fetchGoogleAdsReport(organisationId)
      setReport(result)
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Failed to load live Google Ads data.')
    } finally {
      setLoadingReport(false)
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-sunken p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className={FIELD_LABEL}>Live Google Ads connection</span>
          {statusError ? (
            <span className="text-[12.5px] text-danger-text">{statusError}</span>
          ) : status?.connected ? (
            <span className="flex items-center gap-1.5 text-[12.5px] text-success">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
              Connected — customer ID {status.customerId}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[12.5px] text-text-tertiary">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
              Not connected
            </span>
          )}
        </div>

        {canManage && !pendingRefreshToken && (
          <button
            type="button"
            className="rounded-md border border-overlay/10 bg-surface-raised px-3 py-1.5 text-[12.5px] font-semibold whitespace-nowrap text-text-primary transition-colors duration-150 ease-out hover:bg-overlay/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={handleConnect}
          >
            {status?.connected ? 'Reconnect Google Ads' : 'Connect Google Ads'}
          </button>
        )}
      </div>

      {pendingRefreshToken && (
        <form onSubmit={handleFinishConnecting} className="flex flex-col gap-2 border-t border-border-subtle pt-3">
          <p className="m-0 text-[12.5px] text-text-tertiary">
            Google Ads authorised — enter the customer ID for the account you just granted access to, to finish connecting.
          </p>
          {finishError && (
            <div className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-[12.5px] text-danger-text">{finishError}</div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="google-ads-customer-id">Google Ads customer ID</label>
            <input
              id="google-ads-customer-id"
              className={`${FIELD_INPUT} w-[160px] font-mono`}
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              placeholder="123-456-7890"
              disabled={finishing}
            />
            <button
              type="submit"
              className="rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-canvas transition-colors duration-150 ease-out hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              disabled={finishing}
            >
              {finishing ? 'Saving…' : 'Finish connecting'}
            </button>
          </div>
        </form>
      )}

      {status?.connected && !pendingRefreshToken && (
        <div className="flex flex-col gap-2 border-t border-border-subtle pt-3">
          <button
            type="button"
            className="self-start rounded-md border border-border bg-transparent px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleLoadReport}
            disabled={loadingReport}
          >
            {loadingReport ? 'Loading…' : 'Load live conversion data'}
          </button>

          {reportError && (
            <div className="rounded-md border border-danger/20 bg-danger/10 px-3 py-2 text-[12.5px] text-danger-text">{reportError}</div>
          )}

          {report?.status === 'developer_token_not_configured' && (
            <p className="m-0 rounded-md border border-warning/20 bg-warning/10 px-3 py-2 text-[12.5px] text-warning">
              Blocked — pending Google Ads developer-token approval. The connection above is real and verified;
              pulling live numbers needs a developer token from Google's own review process
              (see decision-log.md ADR-0037/ADR-0039).
            </p>
          )}

          {report?.status === 'ok' && (
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="text-[10.5px] font-semibold tracking-[0.07em] text-text-faint uppercase">
                  <th className="px-2 py-1">Conversion action</th>
                  <th className="px-2 py-1">Conversions</th>
                  <th className="px-2 py-1">Value</th>
                </tr>
              </thead>
              <tbody>
                {report.stats.map(stat => (
                  <tr key={stat.conversionActionName}>
                    <td className="px-2 py-1">{stat.conversionActionName}</td>
                    <td className="px-2 py-1">{stat.conversions}</td>
                    <td className="px-2 py-1">{stat.conversionsValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
