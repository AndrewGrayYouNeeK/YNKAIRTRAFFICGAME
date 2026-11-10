# App Store listing — YNK Air Traffic

Copy the fields below into App Store Connect. Limits are Apple's current field limits. Replace every `REPLACE_ME` value before you submit.

## Identity

| Field | Value |
| --- | --- |
| Name | YNK Air Traffic |
| Bundle ID | `com.youneek.airtraffic` |
| SKU | `ynk-air-traffic-ios` |
| Primary category | Games |
| Secondary category | Simulation |
| Subtitle (30) | Speak clearances. Land planes |
| Version | 1.0.0 |
| Copyright | 2026 YouNeeK |
| Age rating | 4+ |
| Price | Free |

Subtitle character count: `Speak clearances. Land planes` is 29 characters.

## Promotional text (170)

Work a tower shift on your phone. Tap the thumb controls or speak a clearance, then land the airplane. The first shift is a short lesson.

Character count: 137.

## Description

YNK Air Traffic puts a tower cab on your iPhone.

Pick an airport, watch the scope, and clear one airplane at a time. Heading, altitude, speed, and the landing clearance are big buttons along the bottom of the screen, in reach of a thumb. You can type a clearance or tap the mic and say it.

A guided first shift walks through the scope, the buttons, and an optional radio call. You cannot fail the lesson. After that, live traffic, wind, and the occasional emergency are yours to sort out. Landings unlock harder airports.

The game is built for a phone held sideways. Controls stay on the glass. There is no account to create.

YouNeeK does not collect personal data. Scores stay on the device. The microphone is used only when you tap the mic button, and YouNeeK never receives the audio.

## Keywords (100)

`air traffic,ATC,radar,airplane,airport,tower,flight,pilot,simulation,clearance`

Character count, including commas: 78.

## URLs

| Field | Value |
| --- | --- |
| Support URL | `REPLACE_ME_SUPPORT_URL` |
| Marketing URL | optional |
| Privacy Policy URL | `REPLACE_ME_PRIVACY_URL` |

Host [`public/privacy.html`](../public/privacy.html) at the privacy URL. GitHub Pages on this repository can serve that file. Pages shows the exact URL when you turn it on. Confirm the page loads before you paste it into App Store Connect. The support URL has to be http or https. A `mailto:` link is not accepted.

## Age rating answers

Answer none / no for every content category.

- Cartoon or fantasy violence: None
- Realistic violence: None
- Prolonged graphic or sadistic realistic violence: None
- Profanity or crude humor: None
- Mature or suggestive themes: None
- Horror or fear themes: None
- Medical or treatment information: None
- Alcohol, tobacco, or drug use or references: None
- Simulated gambling: None
- Sexual content or nudity: None
- Graphic sexual content and nudity: None
- Contests: None
- Unrestricted web access: No
- Gambling and loot boxes: No
- User-generated content: No
- Made for Kids: No

A missed approach or a collision ends the shift. It is not depicted as violence. The expected rating is 4+.

## App Privacy

Use the nutrition-label answers in [`PRIVACY.md`](../PRIVACY.md). The short version is Data Not Collected.

## Screenshots

The app is landscape only. Upload landscape screenshots. Apple accepts these sizes for the iPhone slots:

| Slot | Accepted landscape size | File |
| --- | --- | --- |
| 6.9-inch and 6.7-inch | 2796 × 1290 | `docs/app-store/screenshots/iphone-6.7-airport.png` and `iphone-6.7-scope.png` |
| 6.5-inch | 2688 × 1242 | `docs/app-store/screenshots/iphone-6.5-airport.png` and `iphone-6.5-scope.png` |

The 6.9-inch slot also accepts the 6.7-inch size, so the 2796 × 1290 pair covers the newest iPhone display. These files are captures of the real game UI at those pixel sizes. Replace them with shots from a device if you want the status bar in the frame. App Review accepts gameplay screenshots without a status bar.

Three to ten screenshots per size. Two are included. You can duplicate a size across localizations.

## Icon

- Marketing icon, 1024 × 1024, no transparency, no rounded corners: `docs/app-store/icon-1024.png`
- The same artwork is the source for the Xcode app icon set and the launch screen.

## Review notes

Paste this into App Review Information notes:

```
The game is landscape. No account is required. The microphone is optional:
the on-screen buttons and the typed clearance work with the mic denied.
To try voice, tap TAP MIC on the command pad and say a short clearance
such as "United one two three heading two five zero". Speech is recognized
on device when the iPhone supports it. The app does not use location,
tracking, or an account. The guided mission starts from the first-launch
dialog or from "Replay the guided mission".
```

Sign-in information: leave blank. There is no account.

## What is bundled

The iOS target loads the Vite production build from the app bundle (`capacitor://localhost`). It does not point at a remote website. That is what App Review expects instead of a thin website wrapper. Haptics fire on command buttons and the mic. The status bar uses light content on the dark scope. Pinch zoom and rubber-band scrolling are off. The phone is kept awake during an active shift when the system allows a wake lock.
