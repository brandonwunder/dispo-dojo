# Community Page Upgrade — Design Document

**Date:** 2026-02-23
**Status:** Approved
**Approach:** Component Library + Custom Hooks (Approach B)

## Overview

Full upgrade of the Dispo Dojo Community page from a basic chat skeleton to a production-grade real-time community platform. The system is architected with reusable hooks and components to support future DM functionality.

## Scope

### Core Fixes
- Messages actually send, display, and persist in Firestore
- Emoji picker inserts emojis into message body correctly
- Error feedback when sends fail (toast notifications)
- Add `authorId` (Firebase UID) to all messages for ownership

### New Features
1. **Emoji Reactions** — Click reactions on messages (like Discord). Reaction map stored on message doc.
2. **Message Editing & Deletion** — Edit/delete own messages. Soft delete with `isDeleted` flag. Admins see deleted messages tagged "(Deleted by [name])".
3. **@Mentions** — Type `@` for autocomplete dropdown. Mentioned names highlighted in message body.
4. **Typing Indicators + Online Status** — "User is typing..." with animated dots. Green online dots in sidebar.
5. **GIF Selector** — Giphy API (free beta key, 100 calls/hour). Search + trending grid. GIF renders inline in message.
6. **File/Image Uploads** — Firebase Storage. Images inline with lightbox. Non-image files as download cards. 10MB max.
7. **Pinned Messages** — Admin-only pin action. Collapsible "X pinned messages" bar at top of feed. Click to scroll-to-message.

## Data Model (Firestore)

### `messages/{messageId}`
```
{
  channelId: string,
  authorId: string,              // Firebase anonymous UID
  authorName: string,
  authorEmail: string,
  body: string,
  gifUrl: string | null,         // Giphy GIF URL
  gifTitle: string | null,       // Alt text
  attachments: [{                // File/image uploads
    url: string,                 // Firebase Storage download URL
    name: string,                // Original filename
    type: string,                // MIME type
    size: number                 // Bytes
  }],
  replyCount: number,
  reactions: {                   // Map of emoji → array of user IDs
    "🔥": ["uid1", "uid2"],
    "👍": ["uid3"]
  },
  isPinned: boolean,
  pinnedAt: Timestamp | null,
  pinnedBy: string | null,
  isDeleted: boolean,
  deletedAt: Timestamp | null,
  deletedBy: string | null,
  isEdited: boolean,
  editedAt: Timestamp | null,
  createdAt: Timestamp
}
```

### `replies/{replyId}`
```
{
  messageId: string,             // Parent message doc ID
  authorId: string,
  authorName: string,
  authorEmail: string,
  body: string,
  gifUrl: string | null,
  gifTitle: string | null,
  attachments: [{ url, name, type, size }],
  isDeleted: boolean,
  deletedAt: Timestamp | null,
  deletedBy: string | null,
  isEdited: boolean,
  editedAt: Timestamp | null,
  createdAt: Timestamp
}
```

### `presence/{odId}`
```
{
  odId: string,
  displayName: string,
  isOnline: boolean,
  lastSeen: Timestamp,
  currentChannel: string | null,
  isTyping: boolean,
  typingIn: string | null        // channelId
}
```

## Custom Hooks

### `useMessages(channelId)`
- Subscribes to `messages` where `channelId` matches, ordered by `createdAt asc`, limit 100
- Returns `{ messages, sendMessage, editMessage, deleteMessage, loading, error }`
- `sendMessage(body, gifUrl?, attachments?)` — creates doc with `authorId` from auth
- `editMessage(messageId, newBody)` — ownership check, updates body, sets `isEdited: true`
- `deleteMessage(messageId)` — ownership OR admin check, sets `isDeleted: true`

### `useReplies(messageId)`
- Subscribes to `replies` filtered by `messageId`
- Returns `{ replies, sendReply, loading }`

### `useReactions(messageId)`
- `toggleReaction(emoji)` — adds/removes UID via `arrayUnion`/`arrayRemove`
- Operates on the message doc's `reactions` map field

### `usePresence(userId, channelId)`
- Write-only hook. Sets `isOnline: true` on mount, updates typing state (debounced 3s auto-clear)
- Sets `isOnline: false` on `beforeunload`

### `useOnlineUsers(channelId)`
- Subscribes to `presence` where `isOnline == true`
- Returns `{ onlineUsers, typingUsers }` (typing filtered to current channel)

### `useGifSearch()`
- Giphy API with debounced search
- Returns `{ searchGifs, trendingGifs, results, loading }`
- Client-side rate limit counter with warning at 80/100 calls

### `useFileUpload()`
- Firebase Storage upload with progress tracking
- Returns `{ upload, progress, error }`
- Validates file type and 10MB size limit

### `useMentions(body)`
- Parses `@username` from message body
- Returns mentioned users for highlight rendering

### `usePinnedMessages(channelId)`
- Queries messages where `isPinned == true`, ordered by `pinnedAt`
- Returns `{ pinnedMessages, pinMessage, unpinMessage }`

## Component Tree

```
Community.jsx (layout shell — sidebar + main + thread panel)
├── ChannelSidebar/
│   ├── ChannelList.jsx              — channel buttons with unread indicators
│   └── OnlineUsersList.jsx          — who's online (green dots, expandable)
├── MessageFeed/
│   ├── PinnedMessagesBar.jsx        — collapsible pinned messages area
│   ├── MessageList.jsx              — scrollable container, auto-scroll
│   ├── MessageBubble.jsx            — avatar, name, body, GIF, attachments, timestamp
│   │   ├── ReactionBar.jsx          — emoji reactions with counts + add button
│   │   ├── MessageActions.jsx       — hover menu: reply, react, edit, delete, pin
│   │   └── AttachmentPreview.jsx    — inline image or file download card
│   ├── TypingIndicator.jsx          — "User is typing..." animated dots
│   └── MessageInput.jsx             — text input + toolbar
│       ├── EmojiPicker.jsx          — categorized emoji grid
│       ├── GifPicker.jsx            — Giphy search + trending grid
│       └── FileUploadButton.jsx     — paperclip icon, file picker, progress bar
├── ThreadPanel/
│   ├── ThreadHeader.jsx             — parent message + close button
│   ├── ReplyList.jsx                — reply messages
│   └── ReplyInput.jsx               — reply input with emoji + GIF + file upload
└── UserProfileCard.jsx              — existing popover (updated with online status)
```

## UX Details

### Message Actions (hover menu)
- Reply, React, Edit (own messages only), Delete (own + admin), Pin (admin only)
- Floating bar appears on message hover, Framer Motion fade-in

### Reactions
- Click existing reaction to toggle yours on/off
- Click "+" button to open mini emoji picker for new reaction
- Reaction shows emoji + count. Tooltip shows who reacted.

### GIF Picker
- Opens as popover from GIF button in message input
- Trending GIFs shown by default
- Search bar with debounced Giphy API calls
- Click GIF to attach to message (preview shown before send)

### Emoji Picker
- Upgraded from 4x4 grid to categorized picker (smileys, hands, animals, food, objects, symbols)
- Searchable

### Typing Indicator
- Shows below message list, above input
- "Brandon is typing..." with animated bouncing dots
- Multiple users: "Brandon and 2 others are typing..."
- Auto-clears after 3s of inactivity

### Online Status
- Green dot next to usernames in sidebar's online list
- Grey dot for offline (with "last seen X ago")

### Deleted Messages
- Regular users: "This message was deleted" placeholder in muted text
- Admins: Original message body shown in strikethrough with "(Deleted by [name])" tag, muted background

### Pinned Messages
- Collapsible bar at top of message feed
- Collapsed: "📌 X pinned messages" slim clickable bar
- Expanded: scrollable list of pinned message previews (author + first line + timestamp)
- Click to scroll to message in feed with highlight flash
- Admins can unpin from expanded view

### @Mentions
- Type `@` to trigger autocomplete dropdown of channel users
- Select user to insert @mention
- Mentioned names render with highlighted background in message body

### File/Image Uploads
- Paperclip button in message input
- Drag-and-drop also supported
- Upload progress bar shown in input area
- Images: inline preview with lightbox on click
- Files: download card with icon, filename, size
- Max 10MB per file

## Technical Notes

### Giphy Integration
- Free beta API key stored as `VITE_GIPHY_API_KEY`
- Rate limit: 100 calls/hour (shared across all users)
- Client-side counter warns at 80% usage
- Fallback plan: migrate to Tenor if limits become an issue

### Firebase Storage
- Path: `community/{channelId}/{messageId}/{filename}`
- Security rules: authenticated users can upload, anyone can read
- Consider adding Cloud Functions for image resizing later

### Auth Integration
- `authorId` pulled from `auth.currentUser.uid` (Firebase anonymous auth)
- Admin check uses existing `user.isAdmin` from AuthContext
- Ownership check: `message.authorId === auth.currentUser.uid`
