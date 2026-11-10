# YNK Air Traffic privacy policy

Effective date: November 10, 2026

The page players and App Review can open is [`public/privacy.html`](public/privacy.html). Host that file at the privacy policy URL you enter in App Store Connect. It is also inside the app at `/privacy.html`, linked from the airport select screen.

## What YouNeeK collects

YouNeeK collects no personal data.

- There is no account and no login.
- There are no analytics, crash-reporting, or advertising SDKs.
- Scores, airport unlocks, and the tutorial choice are stored only in on-device local storage. They are not uploaded.
- YouNeeK does not receive microphone audio or speech transcripts.

## Microphone and speech recognition

The mic button is optional. Thumb buttons and the typed clearance fly the airplane without it.

When the player taps the mic, iOS asks for Microphone and Speech Recognition permission. The native shell uses Apple's Speech framework inside the app because WKWebView does not provide `webkitSpeechRecognition`. The app requests on-device recognition for `en-US` when the device supports it, so the audio stays on the iPhone and the mic still works in airplane mode. If on-device recognition is not available, iOS may send that audio to Apple's speech service to transcribe it. YouNeeK never receives that audio. Android uses the platform speech recognizer the same way: the transcript is used in the game and then discarded.

## Other network calls

The installed app does not load its user interface from the internet. Optional live weather, when the phone is online, sends the selected airport's published coordinates to Open-Meteo. That is not the player's location. If the request fails, the shift uses built-in weather. Map tiles on secondary website screens are also optional and are not required to play.

## App Privacy nutrition label

Enter these answers in App Store Connect. They match a "Data Not Collected" label.

| Question | Answer |
| --- | --- |
| Do you or your third-party partners collect data from this app? | No |
| Data Used to Track You | None |
| Data Linked to You | None |
| Data Not Linked to You | None |
| Tracking | No |
| Contact info, health, financial info, location, contacts, user content, browsing history, search history, identifiers, purchases, usage data, diagnostics, sensitive info | Not collected |
| Microphone audio | Not collected by YouNeeK. Used only for on-device or Apple speech recognition when the player taps the mic. |

Do not add a privacy-nutrition entry for location. The weather request uses the airport the player selected, not Core Location, and the app does not ask for location permission.

## Kids and tracking

The app is not made for kids under 13, does not use tracking, and does not contain third-party advertising.
