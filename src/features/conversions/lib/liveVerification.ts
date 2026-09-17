import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../../../lib/supabase'

export const LIVE_CHECK_DURATION_MINUTES = 10

// Generates a copy-into-console snippet that watches a real page's
// window.dataLayer for LIVE_CHECK_DURATION_MINUTES and reports every pushed
// event back to Supabase, tagged with checkToken. There's no Supabase
// session on the business owner's own site, so this authenticates purely
// with the public anon key — the same one already shipped in this app's own
// bundle — and relies on the INSERT policy's conversion_event/organisation
// existence check rather than auth.uid() (see the migration).
export function buildLiveVerificationSnippet(params: {
  checkToken: string
  conversionEventId: string
  organisationId: string
}): string {
  const { checkToken, conversionEventId, organisationId } = params
  return `(function () {
  var CHECK_TOKEN = ${JSON.stringify(checkToken)};
  var CONVERSION_EVENT_ID = ${JSON.stringify(conversionEventId)};
  var ORGANISATION_ID = ${JSON.stringify(organisationId)};
  var SUPABASE_URL = ${JSON.stringify(SUPABASE_URL)};
  var ANON_KEY = ${JSON.stringify(SUPABASE_ANON_KEY)};
  var DURATION_MS = ${LIVE_CHECK_DURATION_MINUTES} * 60 * 1000;

  window.dataLayer = window.dataLayer || [];
  var originalPush = window.dataLayer.push.bind(window.dataLayer);

  function report(item) {
    try {
      fetch(SUPABASE_URL + '/rest/v1/live_verification_events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: 'Bearer ' + ANON_KEY,
        },
        body: JSON.stringify({
          check_token: CHECK_TOKEN,
          conversion_event_id: CONVERSION_EVENT_ID,
          organisation_id: ORGANISATION_ID,
          event_name: item && typeof item === 'object' && item.event ? String(item.event) : null,
          event_payload: item,
        }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  window.dataLayer.push = function () {
    for (var i = 0; i < arguments.length; i++) report(arguments[i]);
    return originalPush.apply(window.dataLayer, arguments);
  };

  console.log('TagOps Pro is watching this page\\'s dataLayer for ${LIVE_CHECK_DURATION_MINUTES} minutes — go ahead and do the thing that should trigger the event.');

  setTimeout(function () {
    window.dataLayer.push = originalPush;
    console.log('TagOps Pro live check has ended.');
  }, DURATION_MS);
})();`
}
