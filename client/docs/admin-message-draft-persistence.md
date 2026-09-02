# Admin Message Draft Persistence

The admin message field now keeps an unfinished message in `localStorage`.
This means a reload or accidentally closed tab does not immediately lose the
user's work. After a successful form submission, the draft is removed and the
field starts empty again.

## How it works

The implementation is in [`components/admin/index.tsx`](../components/admin/index.tsx).

1. `useWatch` observes the `message` field from `react-hook-form`.
2. A client-only effect reads the `admin-message-draft` key and restores it.
3. A second effect waits 300 ms after typing stops, then saves the latest value.
4. Submitting the form removes the key before resetting the form.
5. Empty input removes the key, so stale empty drafts are not kept forever.

The hydration flag is important. Without it, the initial empty form value could
be saved before the existing browser draft is restored, overwriting the draft.

## Why use `localStorage`?

`localStorage` is a good choice for this feature because the draft is small,
belongs to this browser, and does not need to be sent to the server or encoded
in a URL. It survives page reloads and tab closure, but it is scoped to the
same origin and browser profile.

### Pros

- Simple implementation with no new dependency.
- Works after reloads and closed tabs.
- Fast and available offline.
- The draft stays in the browser instead of being sent to the backend.

### Cons

- The draft is lost if the user clears site data or changes browser/device.
- `localStorage` is not encrypted. Do not use it for passwords, tokens, or
  highly sensitive message content.
- Multiple tabs share the same key, so the most recently saved text wins.
- Storage can be disabled or unavailable, which is why the code handles errors.

## Why debounce the save?

Saving every keystroke would usually work for a short string, but it creates
unnecessary synchronous storage writes. The 300 ms delay waits until typing
briefly pauses, keeping the experience responsive while still protecting the
draft almost immediately.

The debounce is implemented with `useEffect` and `setTimeout`, so another
dependency is not needed. A utility such as `lodash.debounce` would be useful
if the application already had many debounced behaviors, but it would be extra
weight for this one field.

## Why not `nuqs`?

`nuqs` is designed for state stored in URL query parameters, such as filters,
pagination, sorting, and shareable search state. This message is a private,
temporary draft and should not appear in browser history, copied links, server
requests, or analytics URLs. `localStorage` is therefore the better fit.

Use `nuqs` instead if the value needs to be shareable, bookmarkable, or restored
through a URL. Use a backend draft table instead if the value must follow the
user across devices, browsers, or accounts.

## Testing checklist

- Type a message, reload the page, and confirm it returns.
- Close and reopen the tab, and confirm it returns.
- Submit a valid message, then reload and confirm the field is empty.
- Delete all text and reload; confirm no empty draft is restored.
- Try the shortcuts and confirm their inserted text is also persisted.
- Confirm sensitive data is not being placed in this draft field.

## Chategy form

The Chategy request builder uses the same pattern in
[`components/chategy/index.tsx`](../components/chategy/index.tsx). It saves the
selected backend service and prompt as one JSON draft under the separate key
`chategy-request-draft`.

The uploaded file is intentionally not persisted. Browser security rules do not
allow an application to restore a file input after reload, and silently storing
file contents would also use more storage and create additional privacy risk.
The user must select the file again after reopening the page, while the mode and
prompt are restored.

Chategy clears its draft only after a successful code-execution or file-analysis
request. If validation fails or the backend returns an error, the draft remains
available for correction and retry.
