// Bridge exposed by the Electron preload script (see desktop/preload.cjs).
// Present only when the app runs inside the desktop shell.
interface DesktopAuth {
  // Opens the OAuth URL in the system browser and resolves with the
  // Supabase auth code caught by the loopback callback server.
  signIn(url: string): Promise<string>
}

interface Window {
  desktopAuth?: DesktopAuth
}
