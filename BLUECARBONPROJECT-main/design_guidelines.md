# BlueCarbon Ledger Design Guidelines

## Design Approach: Reference-Based (Ocean-Themed Fintech)

**Primary Inspirations:**
- Stripe's dashboard clarity and data visualization
- Linear's typography hierarchy and minimal aesthetic
- Coinbase's blockchain explorer patterns
- Custom ocean-themed visual system

**Core Principle:** Futuristic minimalism with ocean immersion - clean data presentation within an aquatic environment that builds trust through transparency.

---

## Typography System

**Font Stack:**
- Primary: 'Inter' for UI elements and data
- Accent: 'Space Grotesk' for headings and blockchain elements
- Mono: 'JetBrains Mono' for hashes, txIds, and technical data

**Hierarchy:**
- Page Titles: 2.5rem (40px), semibold, Space Grotesk
- Section Headers: 1.875rem (30px), semibold, Inter
- Card Titles: 1.25rem (20px), medium, Inter
- Body Text: 1rem (16px), regular, Inter
- Technical Data: 0.875rem (14px), mono, JetBrains Mono
- Captions: 0.75rem (12px), regular, Inter

---

## Layout System

**Spacing Scale:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 consistently
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-20
- Card gaps: gap-6
- Grid gaps: gap-8

**Grid Structure:**
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Stats display: grid-cols-2 md:grid-cols-4
- Project tables: Full width with responsive scroll
- Max container width: max-w-7xl

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with backdrop blur effect (ocean gradient overlay)
- Logo left (wave icon + "BlueCarbon Ledger" in Space Grotesk)
- Navigation links center (Dashboard, Explorer, Projects)
- Right: Carbon counter badge + User avatar dropdown + Dark mode toggle
- Height: h-16, glass morphism effect with subtle border

**Sidebar (Dashboard Pages):**
- Left sidebar: w-64 on desktop, slide-out on mobile
- Role badge at top (Admin/Verifier/User with icon)
- Menu items with icons, active state has aqua accent bar
- Bottom: Logout + settings icons

### Cards & Data Display
**Stats Cards:**
- Rounded corners (rounded-xl)
- Soft shadow with glow effect on hover
- Icon top-left in circular container with gradient
- Large number display (2.5rem) with label below
- Micro-animation on value changes

**Project Cards:**
- Grid layout with image/icon placeholder top
- Status badge (Pending: amber, Verified: emerald, Rejected: red)
- Project name as heading
- CO₂ captured in bold with ton unit
- Proof file indicator icon
- Action buttons (View Details, Download Certificate)
- Border highlight for verified projects

**Blockchain Block Cards:**
- Collapsible accordion design
- Header shows: Block #, Timestamp, abbreviated BlockHash
- Expand reveals: Full hashes, MerkleRoot, PreviousHash, Transaction count
- Chain connection visual (line connecting to previous block)
- Copy buttons for all hashes
- Verification checkmark animation

### Forms
**Project Submission Form:**
- Two-column layout on desktop
- File upload zone with drag-and-drop (ocean wave pattern background)
- Input fields with floating labels
- CO₂ calculation helper (shows tons based on project type)
- Submit button with loading animation (wave pulse)

**Login/Signup:**
- Centered card (max-w-md) over animated ocean background
- Role selector for demo credentials display
- Input fields with aqua focus ring
- Glass morphism card effect
- "How it works" link in footer

### Tables
**Project Management Table:**
- Sticky header with frosted glass effect
- Alternating row subtle tint
- Sort indicators on columns
- Filter dropdowns in header
- Action column with icon buttons
- Pagination with page info
- Hash columns show first 8 chars + "..." with copy button

### Blockchain Explorer
**Search Bar:**
- Prominent centered search (like Google)
- Placeholder: "Search by Block Hash, Transaction ID, or Project Name"
- Search suggestions dropdown
- Recent searches chips below

**Explorer Results:**
- Timeline view for blocks (vertical line connecting blocks)
- Transaction details in expandable panels
- Hash verification section with input field + "Verify" button
- Visual indicators: ✅ Verified / ❌ Tampered
- JSON export button for each block/transaction

### Modals
**How It Works Walkthrough:**
- Full-screen overlay with ocean animation background
- Step-by-step cards (4-5 steps) with illustrations
- Progress dots at bottom
- "Next" and "Skip" options
- Final step shows demo credentials table

**Certificate Preview:**
- A4-sized preview area
- Professional certificate layout with blockchain seal
- Project details, txId, blockHash displayed
- Download PDF button prominent
- QR code linking to blockchain explorer entry

---

## Ocean Theme Visual Elements

### Background Animations
**Homepage Hero:**
- Gradient mesh background (aqua to deep navy)
- Floating bubble SVG animations (random sizes, slow upward motion)
- Subtle wave SVG at bottom (animated with CSS)
- Glass morphism overlay for content

**Dashboard Backgrounds:**
- Subtle animated gradient (shift between blues)
- Particle effect (smaller bubbles, more subtle than hero)
- Depth effect with layered gradients

### Decorative Elements
- Coral accent shapes in section dividers
- Wave patterns in empty states
- Bubble clusters as loading indicators
- Ripple effects on button clicks
- Glow effects on verified status badges

### Icons
- Heroicons for standard UI
- Custom ocean-themed icons: wave (logo), coral, fish, bubble for carbon credits
- Blockchain icons: block, chain link, hash, verified seal

---

## Interactive States

**Buttons:**
- Primary: Aqua gradient with white text, subtle shadow
- Secondary: Transparent with aqua border, fill on hover
- Danger: Coral red for rejections
- All buttons: smooth transition (0.2s), slight scale on hover (scale-105)

**Cards:**
- Hover: Lift effect (shadow increase + translate-y)
- Active projects: Pulse animation on status badge
- Loading states: Shimmer effect across card

**Hash Display:**
- Click to expand full hash in tooltip
- Copy button appears on hover
- Success feedback (✓ Copied!) animation

---

## Responsive Behavior

**Breakpoints:**
- Mobile: Single column, stack everything
- Tablet (md): 2-column grids, sidebar becomes drawer
- Desktop (lg): 3-column grids, persistent sidebar
- Stats counters: Reduce font size proportionally

**Mobile-Specific:**
- Bottom navigation bar for main actions
- Swipe gestures for blockchain explorer
- Simplified tables with expandable rows
- Floating action button for "Submit Project"

---

## Accessibility

- High contrast text (WCAG AAA on dark backgrounds)
- Focus rings: 2px aqua glow
- Hash tooltips with aria-labels explaining technical terms
- Keyboard navigation for all interactive elements
- Screen reader announcements for blockchain verification results
- Color-blind friendly status indicators (icons + text, not just color)

---

## Images

**Homepage Hero:**
- Large hero image: Underwater coral reef ecosystem with sunlight filtering through water (sets the ocean theme mood)
- Overlay: Dark gradient (bottom to top) for text readability
- Hero content: Centered text with blurred-background buttons

**Dashboard Empty States:**
- Illustrations: Minimalist ocean creatures (whale for "no projects yet", coral for "no transactions")
- Style: Line art in aqua tones, consistent with overall aesthetic

**Certificate Graphics:**
- Blockchain seal/badge graphic (geometric pattern suggesting interconnected blocks)
- Ocean wave watermark as background element