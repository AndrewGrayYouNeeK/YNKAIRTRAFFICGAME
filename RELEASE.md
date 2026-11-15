# Releasing YNK Air Traffic

Andrew, the repo now contains an Xcode project and an Android Studio project. The game you already play on the web is what those projects display. You still have to sign the iOS app with your Apple Developer account and upload it. Nobody else can do that part.

The web app is unchanged as a website: `npm install`, `npm run dev`, and `npm run build` still work. Base44 is not part of this project.

## What you are shipping

| Item | Value |
| --- | --- |
| Name on the home screen | YNK Air Traffic |
| Bundle ID | `com.youneek.airtraffic` |
| Version | 1.0.0 |
| Build | 1 |
| Orientation | Landscape, iPhone and iPad |
| Xcode project | `ios/App/App.xcodeproj` |
| Android project | `android/` |

Open `ios/App/App.xcworkspace` if it exists, otherwise `ios/App/App.xcodeproj`. This project uses Swift Package Manager, so the `.xcodeproj` is the one to open.

## One-time Apple setup

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) with the Apple ID you want on the app. Approval can take Apple a day or two. A free Apple ID can run the app on your own phone from Xcode, but it cannot upload to TestFlight or the App Store.
2. In [App Store Connect](https://appstoreconnect.apple.com), create an app.
   - Platforms: iOS
   - Name: YNK Air Traffic. If Apple says the name is taken, use `YNK Air Traffic Control` and tell the developer who updates the Xcode display name.
   - Primary language: English (U.S.)
   - Bundle ID: register `com.youneek.airtraffic` as an explicit App ID with no extra capabilities except the defaults. Do not enable Push, iCloud, or Sign in with Apple.
   - SKU: `ynk-air-traffic-ios`
   - User access: full access
3. In Certificates, Identifiers & Profiles, create an **Apple Distribution** certificate and an **App Store** provisioning profile for `com.youneek.airtraffic`. Xcode can create both for you in step 6 if you would rather click through the dialogs.
4. Host `public/privacy.html` at a public https URL. The listing copy and the nutrition-label answers are in `docs/APP_STORE.md` and `PRIVACY.md`.
5. Put a real support URL in App Store Connect. `docs/APP_STORE.md` marks both URLs as `REPLACE_ME`.

## Put the latest game into the Xcode project

On a Mac, from the repository root:

```bash
npm install
npm run ios:sync
```

`ios:sync` builds the website into `dist/` and copies it into the iOS app. Do this whenever the game changes before you archive. The copy under `ios/App/App/public` is generated and is not committed.

## Run it on your iPhone

1. Install Xcode from the Mac App Store. Open `ios/App/App.xcodeproj`.
2. Select the **App** target → **Signing & Capabilities**.
3. Check **Automatically manage signing**.
4. Team: your Apple Developer team. If the bundle id conflicts with another team, stop and do not change it without updating the App ID to match.
5. Connect the iPhone, select it as the run destination, and press Run.
6. The first launch asks for the microphone and for speech recognition only after you tap **TAP MIC**. You can deny both and still play with the buttons.
7. If iOS says the developer is not trusted: Settings → General → VPN & Device Management → trust your developer certificate.

The phone should be in landscape. The command pad sits at the bottom, above the home indicator. The notch or Dynamic Island is inset on the side.

## Archive and upload with Xcode

This is the path to use. The GitHub Action is optional and is off until you add secrets.

1. In Xcode, set the run destination to **Any iOS Device (arm64)**.
2. Confirm the target version is **1.0.0** and the build is **1** (General → Identity). Bump the build number for every upload, even when the version stays 1.0.0.
3. Product → Archive. Wait until the Organizer opens.
4. Distribute App → App Store Connect → Upload.
5. Leave bitcode off (Xcode no longer offers it). Symbol upload can stay on.
6. When the upload finishes, wait for App Store Connect to finish processing. That often takes 10–30 minutes, sometimes longer. You get an email when TestFlight is ready.

## TestFlight

1. App Store Connect → your app → TestFlight.
2. Answer the export compliance question. The app only uses standard HTTPS. `Info.plist` already sets `ITSAppUsesNonExemptEncryption` to false, so this prompt often does not appear. If it does, say the app does not use non-exempt encryption.
3. Install TestFlight on the iPhone and accept the build.
4. Play a shift, including a tap on the mic, before you submit for review.

## Submit for review

1. App Store Connect → the iOS app → the 1.0.0 version.
2. Paste the text from `docs/APP_STORE.md`: subtitle, promotional text, description, keywords, support URL, and privacy URL.
3. Upload the screenshots in `docs/app-store/screenshots/`. Use the 6.7-inch pair for the 6.9-inch / 6.7-inch slot and the 6.5-inch pair for the 6.5-inch slot. Drag the 1024 icon in if App Store Connect does not take it from the binary.
4. Age rating: walk the questionnaire using the answers in `docs/APP_STORE.md`. Expect 4+.
5. App Privacy: Data Not Collected. Details are in `PRIVACY.md`.
6. Review notes: copy the note from `docs/APP_STORE.md`. No demo account.
7. Add the build you uploaded, then click Add for Review → Submit.

Apple's first review is the step that can reject the app. The usual risks for this project, and how they are already handled:

- The UI is local, not a remote website.
- Microphone and speech strings are in `Info.plist`, and the mic uses the native speech recognizer because the iOS web view cannot hear the browser speech API.
- The privacy policy is a real page, not a placeholder inside the binary only. The Connect form still needs your hosted URL.

## GitHub Action (optional, off)

`.github/workflows/ios-release.yml` does not run on push. It runs only when you start it by hand, and the release job does nothing until you set a repository variable.

1. Repo → Settings → Secrets and variables → Actions → Variables → New repository variable.
   - Name: `IOS_RELEASE_ENABLED`
   - Value: `true`
2. Add these repository secrets. Do not commit the files.

| Secret | What it is |
| --- | --- |
| `APPLE_TEAM_ID` | 10-character Team ID from the developer account membership page |
| `IOS_DISTRIBUTION_CERTIFICATE_BASE64` | Base64 of the Apple Distribution `.p12` |
| `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD` | Password for that `.p12` |
| `IOS_PROVISION_PROFILE_BASE64` | Base64 of the App Store `.mobileprovision` for `com.youneek.airtraffic` |
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID of an App Store Connect API key with Developer access or higher |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID shown above the keys |
| `APP_STORE_CONNECT_API_KEY_BASE64` | Base64 of the downloaded `AuthKey_XXXXXXXX.p8` |

Create the API key in App Store Connect → Users and Access → Integrations → App Store Connect API. You can download the `.p8` once.

Encode a file on your Mac:

```bash
base64 -i Certificates.p12 | pbcopy
base64 -i profile.mobileprovision | pbcopy
base64 -i AuthKey_ABC123XYZ.p8 | pbcopy
```

3. Actions → **iOS App Store** → Run workflow.

Until `IOS_RELEASE_ENABLED` is `true`, a manual run stops in the gate job and does not start a Mac. The workflow archives with manual signing and uploads the `.ipa` with `xcrun altool`. If a future Xcode removes `altool`, upload that same archive from Xcode Organizer. The action is a convenience, not the only way up.

## Android (optional)

The same game is in `android/`. It is not required for the App Store.

```bash
npm run android:sync
```

Open `android/` in Android Studio, set the application id `com.youneek.airtraffic`, and use your own upload keystore. The manifest requests `RECORD_AUDIO` and locks landscape. Play signing and the Play Console listing are separate from the Apple steps above.

## After the game changes

```bash
npm test
npm run build
npm run ios:sync
```

Then archive again and upload a higher build number.

## What this environment could not do

The project files were checked on Linux. Xcode does not run here, so the `.ipa` was not compiled and the mic was not exercised on a device. The first Run on your iPhone is the real check for speech recognition, haptics, and the home indicator.
