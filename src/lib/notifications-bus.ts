// Cross-component signal for the notifications UI.
//
// The header bell and the /notifications history list live in different
// parts of the React tree (root layout vs page subtree), so optimistic
// mark-read on the page can't reach the bell's local state directly.
// Both components share unread state via window CustomEvents: the LIST
// dispatches when a row is marked read; the BELL listens and updates
// its badge + local items in the same frame. The bell never dispatches
// — it's terminal — which keeps the bus unidirectional and removes any
// risk of feedback loops.
//
// SSR-safe: the dispatch helpers no-op on the server.

export const NOTIF_READ_EVENT = 'hearsay:notification-read';
export const NOTIF_ALL_READ_EVENT = 'hearsay:notifications-all-read';

export interface NotificationReadDetail {
  id: string;
}

export function dispatchNotificationRead(id: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<NotificationReadDetail>(NOTIF_READ_EVENT, {
      detail: { id },
    })
  );
}

export function dispatchAllNotificationsRead(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(NOTIF_ALL_READ_EVENT));
}
