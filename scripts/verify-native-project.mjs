import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function need(relative, test) {
  const file = path.join(root, relative);
  if (!existsSync(file)) {
    failures.push(`missing ${relative}`);
    return "";
  }
  const text = statSync(file).isDirectory() ? "" : readFileSync(file, "utf8");
  if (test && !test(text, file)) failures.push(`check failed: ${relative}`);
  return text;
}

function includes(needle) {
  return (text) => text.includes(needle);
}

need("ios/App/App.xcodeproj/project.pbxproj", (text) => (
  text.includes("com.youneek.airtraffic")
  && text.includes("MARKETING_VERSION = 1.0.0")
  && text.includes("CURRENT_PROJECT_VERSION = 1;")
));
need("ios/App/App/Info.plist", (text) => (
  text.includes("NSMicrophoneUsageDescription")
  && text.includes("NSSpeechRecognitionUsageDescription")
  && text.includes("UIInterfaceOrientationLandscapeLeft")
  && text.includes("UIInterfaceOrientationLandscapeRight")
  && !text.includes("UIInterfaceOrientationPortrait</string>")
  && text.includes("YNK Air Traffic")
  && text.includes("ITSAppUsesNonExemptEncryption")
));
need("ios/App/App/PrivacyInfo.xcprivacy", includes("NSPrivacyTracking"));
need("android/app/build.gradle", (text) => (
  text.includes('applicationId "com.youneek.airtraffic"')
  && text.includes("versionName \"1.0.0\"")
  && text.includes("versionCode 1")
));
need("android/app/src/main/AndroidManifest.xml", (text) => (
  text.includes("RECORD_AUDIO")
  && text.includes("sensorLandscape")
  && text.includes("RecognitionService")
));
need("PRIVACY.md", includes("Data Not Collected"));
need("public/privacy.html", includes("YNK Air Traffic"));
need("RELEASE.md", includes("Apple Developer"));
need("docs/APP_STORE.md", includes("Speak clearances"));
need("docs/app-store/icon-1024.png");
need("docs/app-store/screenshots/iphone-6.7-scope.png");
need("docs/app-store/screenshots/iphone-6.5-scope.png");
need("assets/icon-only.png");
need("assets/splash.png");

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
if (packageJson.version !== "1.0.0") failures.push("package.json version is not 1.0.0");
if (JSON.stringify(packageJson).toLowerCase().includes("base44")) failures.push("package.json mentions base44");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("native project checks passed");
