# OCEAN COLOR MAPPING REFERENCE
**Visual guide for ocean color scheme implementation**

---

## 🎨 COLOR PALETTE

### Glacier - #72a3bf (Light Ocean Blue)
```css
/* Hex: #72a3bf */
/* RGB: rgb(114, 163, 191) */
/* HSL: hsl(202, 40%, 60%) */
```
**Usage**: Accents, highlights, hover states, light emphasis
**Variants**: 
- `glacier-light`: #8cb5cd
- `glacier-dark`: #5d92b0

### Harbor - #1d4052 (Dark Ocean Blue)
```css
/* Hex: #1d4052 */
/* RGB: rgb(29, 64, 82) */
/* HSL: hsl(202, 49%, 22%) */
```
**Usage**: Dark emphasis, headers, navigation, dark mode cards
**Variants**:
- `harbor-light`: #2a5468
- `harbor-dark`: #16333f

### Marine - #446e87 (Medium Ocean Blue)
```css
/* Hex: #446e87 */
/* RGB: rgb(68, 110, 135) */
/* HSL: hsl(202, 32%, 40%) */
```
**Usage**: Primary buttons, borders, links, icons, main emphasis
**Variants**:
- `marine-light`: #5a8199
- `marine-dark`: #365870

### Depth - #030f18 (Deep Ocean Black)
```css
/* Hex: #030f18 */
/* RGB: rgb(3, 15, 24) */
/* HSL: hsl(202, 70%, 5%) */
```
**Usage**: Dark backgrounds, shadows, dark mode background
**Variants**:
- `depth-light`: #0a1a26
- `depth-dark`: #010508

### Frost - #e0e8e6 (Light Frost Gray)
```css
/* Hex: #e0e8e6 */
/* RGB: rgb(224, 232, 230) */
/* HSL: hsl(162, 15%, 91%) */
```
**Usage**: Light backgrounds, cards, subtle containers
**Variants**:
- `frost-light`: #f0f5f4
- `frost-dark`: #d0d8d6

---

## 🔄 COLOR REPLACEMENT MAP

### Old → New Conversions

| Old Class | New Class | Where Used |
|-----------|-----------|------------|
| `blue-600` | `marine` | Primary buttons, main links, emphasis |
| `blue-500` | `glacier` | Secondary accents, lighter emphasis |
| `blue-400` | `glacier-light` | Very light accents |
| `purple-600` | `harbor` | Dark emphasis, headers |
| `purple-500` | `marine` | Medium emphasis |
| `purple-400` | `glacier` | Light accents |
| `indigo-600` | `marine` | Alternative primary |
| `indigo-500` | `glacier` | Alternative secondary |

### Gradient Conversions

| Old Gradient | New Gradient | Usage |
|-------------|--------------|--------|
| `from-blue-600 to-purple-600` | `from-marine to-harbor` | Dark gradient circles, hero elements |
| `from-blue-500 to-blue-600` | `from-glacier to-marine` | Light gradient circles, icons |
| `from-purple-600 to-blue-600` | `from-harbor to-marine` | Alternative dark gradients |
| `from-blue-400 to-purple-500` | `from-glacier to-harbor` | Softer gradients |

---

## 📍 WHERE EACH COLOR IS USED

### 🏠 Homepage (app/page.tsx)

#### Trust Circles (Lines 136-140)
```tsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-marine to-harbor" />
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-marine to-harbor" />
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-glacier to-marine" />
```

#### Feature Icons (Line 330, 350)
```tsx
{/* Analytics */}
<div className="w-12 h-12 bg-gradient-to-br from-marine to-harbor rounded-lg" />

{/* SEO */}
<div className="w-12 h-12 bg-gradient-to-br from-glacier to-marine rounded-lg" />
```

#### Testimonial Avatars (Lines 458-460)
```tsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-marine to-harbor" />
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-glacier to-marine" />
```

### 📊 Client Report (app/report/[slug]/page.tsx)

#### Domain Link (Line 212)
```tsx
<a className="ml-2 text-marine hover:text-harbor">
```

#### View Report Button (Line 234)
```tsx
<Button className="bg-marine hover:bg-harbor text-white">
```

#### Section Cards (Line 367)
```tsx
<Card className="border-glacier bg-frost/50">
```

#### Section Icons (Lines 370, 418, 443)
```tsx
<Search className="h-5 w-5 text-marine" />
<Globe className="h-5 w-5 text-marine" />
<BarChart3 className="h-5 w-5 text-marine" />
```

#### Property Badges (Lines 429, 454)
```tsx
<div className="p-3 bg-frost rounded-lg text-sm">
```

### 🎯 Action Plans (app/report/[slug]/action-plans/page.tsx)

#### Loader (Line 70)
```tsx
<Loader2 className="w-4 h-4 text-marine animate-spin" />
```

### 📈 Dashboard Components

#### ComprehensiveDashboard.tsx (21 instances)
```tsx
{/* Trend icons */}
<TrendingUp className="h-4 w-4 text-marine" />

{/* Metric cards */}
<Card className="border-glacier bg-frost/50">

{/* Progress bars */}
<div className="bg-marine h-2" />

{/* Buttons */}
<Button className="bg-marine hover:bg-harbor">
```

#### ActionableInsights.tsx (6 instances)
```tsx
{/* Priority badges */}
<Badge className="bg-marine text-white">

{/* Action cards */}
<Card className="border-glacier">
```

#### AIVisibility.tsx (4 instances)
```tsx
{/* Visibility indicators */}
<div className="text-marine">
<div className="bg-marine/10 border-marine">
```

### ⚙️ Admin Dashboard

#### Sidebar Navigation (app/admin/layout.tsx)
```tsx
{/* Active state */}
<Link className="bg-marine text-white">
```

#### Google Accounts (app/admin/google-accounts/page.tsx)
```tsx
<Button className="bg-marine hover:bg-harbor">Connect Google Account</Button>
<Badge className="text-marine">Connected</Badge>
```

#### Reports (app/admin/reports/page.tsx)
```tsx
<Card className="border-glacier">
<Button className="text-marine hover:text-harbor">View</Button>
```

---

## 🎨 TAILWIND CLASSES REFERENCE

### Background Colors
```css
bg-glacier       /* #72a3bf */
bg-harbor        /* #1d4052 */
bg-marine        /* #446e87 */
bg-depth         /* #030f18 */
bg-frost         /* #e0e8e6 */
```

### Text Colors
```css
text-glacier     /* #72a3bf */
text-harbor      /* #1d4052 */
text-marine      /* #446e87 */
text-depth       /* #030f18 */
text-frost       /* #e0e8e6 */
```

### Border Colors
```css
border-glacier   /* #72a3bf */
border-harbor    /* #1d4052 */
border-marine    /* #446e87 */
```

### Gradient From
```css
from-glacier     /* Start: #72a3bf */
from-harbor      /* Start: #1d4052 */
from-marine      /* Start: #446e87 */
from-depth       /* Start: #030f18 */
```

### Gradient To
```css
to-glacier       /* End: #72a3bf */
to-harbor        /* End: #1d4052 */
to-marine        /* End: #446e87 */
to-depth         /* End: #030f18 */
```

### Hover States
```css
hover:bg-harbor       /* Hover background */
hover:text-harbor     /* Hover text */
hover:border-marine   /* Hover border */
```

---

## 🔍 COMMON PATTERNS

### Pattern 1: Primary Button
```tsx
<Button className="bg-marine hover:bg-harbor text-white">
  Click Me
</Button>
```

### Pattern 2: Card with Border
```tsx
<Card className="border-glacier bg-frost/50">
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Pattern 3: Icon with Color
```tsx
<Icon className="h-5 w-5 text-marine" />
```

### Pattern 4: Gradient Circle
```tsx
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-marine to-harbor" />
```

### Pattern 5: Link with Hover
```tsx
<a className="text-marine hover:text-harbor">
  Learn More
</a>
```

### Pattern 6: Badge
```tsx
<Badge className="bg-marine text-white">
  Status
</Badge>
```

### Pattern 7: Progress Bar
```tsx
<div className="w-full bg-frost rounded-full h-2">
  <div className="bg-marine h-2 rounded-full" style={{width: '75%'}} />
</div>
```

### Pattern 8: Trend Indicator
```tsx
<div className="flex items-center gap-1">
  <TrendingUp className="h-4 w-4 text-marine" />
  <span className="text-sm text-marine">+12%</span>
</div>
```

---

## 📋 SAFELIST CLASSES

**These classes are protected from Tailwind purging in production:**

```javascript
safelist: [
  // Gradient from
  'from-glacier', 'from-harbor', 'from-marine', 'from-depth',
  
  // Gradient to
  'to-glacier', 'to-harbor', 'to-marine', 'to-depth',
  
  // Backgrounds
  'bg-glacier', 'bg-harbor', 'bg-marine', 'bg-depth', 'bg-frost',
  
  // Text
  'text-glacier', 'text-harbor', 'text-marine', 'text-depth',
  
  // Borders
  'border-glacier', 'border-harbor', 'border-marine',
  
  // Hover states
  'hover:bg-harbor', 'hover:text-harbor',
]
```

---

## 🌓 LIGHT vs DARK MODE

### Light Mode Colors
- Background: `frost` (#e0e8e6)
- Foreground: `depth` (#030f18)
- Primary: `glacier` (#72a3bf)
- Borders: `marine` (#446e87)

### Dark Mode Colors
- Background: `depth` (#030f18)
- Foreground: `frost` (#e0e8e6)
- Cards: `harbor` (#1d4052)
- Primary: `glacier` (#72a3bf)
- Borders: `marine` (#446e87)

---

## ✅ VERIFICATION CHECKLIST

After deployment, check these elements on https://searchsignal.online:

### Homepage
- [ ] Trust circles show `marine→harbor` gradient
- [ ] Feature icons show `glacier→marine` gradient
- [ ] Avatar circles have ocean gradients
- [ ] CTA buttons are `marine` with `harbor` hover

### Client Report
- [ ] Domain links are `marine` with `harbor` hover
- [ ] View buttons are `marine` background
- [ ] Section cards have `glacier` border and `frost` background
- [ ] Icons are `marine` color
- [ ] Property badges have `frost` background

### Admin Dashboard
- [ ] Sidebar active state is `marine`
- [ ] Connect buttons are `marine` with `harbor` hover
- [ ] Report cards have `glacier` borders

---

**QUICK TEST**: Search page source for `from-marine` - should find multiple matches
