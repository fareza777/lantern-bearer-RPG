# Android debug build

Use the existing wrapper at `E:\gloamreach-app`. Its application ID is
`com.hollowlantern.gloamreach`; preserve its native files and signing identity.
The Act III wrapper version is `versionCode 2`, `versionName "3.0.0"`.

Before the version change, 527 files were archived and verified byte-for-byte:

- Backup: `E:\gloamreach-app\backups\act3-prebuild-20260929-083203.zip`
- Contents: `android/app/build.gradle`, `www/`, and `android/app/src/main/assets/`
- SHA-256: `b905833de8c83de72535da248ebbb034bad925aad3fbcb9d5a8eacfb13709713`

The backup does not replace or remove any original files. The existing workspace
`gloamreach-debug.apk` must remain intact. Publish the new local debug artifact as
`gloamreach-act3-debug.apk` only after the checks below pass.

## Prerequisites already present

- JDK: `C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot`
- SDK: `C:\Users\FAJAR\AppData\Local\Android\Sdk`, platform 36/build tools 36.0.0
- Capacitor 8.5.2 in the wrapper's `node_modules`
- Gradle wrapper 8.14.3 and Android Gradle Plugin 8.13.0 in the local caches

No SDK or package installation is needed for the intended offline build.

## Reproduce after final web assets are ready

First run these from the game source directory. Do not package missing artwork or
a stale cache manifest. The voice allowance covers the documented unavailable
Act III narration; it does not permit missing raster art.

```powershell
node tools/verify-content.cjs --allow-missing-voice
node tools/test-gameplay.cjs
node tools/build-cache.cjs
node tools/test-offline.cjs
```

After all checks pass, copy the finalized web files. This intentionally preserves
the native Android project and the old APK.

```powershell
$taskSource = 'E:\New Grim Clone Factory'
$taskWeb = 'E:\gloamreach-app\www'
foreach ($taskName in @('index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets')) {
  Copy-Item -LiteralPath (Join-Path $taskSource $taskName) -Destination $taskWeb -Recurse -Force
}
Set-Location 'E:\gloamreach-app'
node .\node_modules\@capacitor\cli\bin\capacitor copy android
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot'
$env:ANDROID_HOME = 'C:\Users\FAJAR\AppData\Local\Android\Sdk'
Set-Location .\android
.\gradlew.bat --offline --no-daemon assembleDebug
```

Verify the APK version and signer before copying it. Compare the signer certificate
with the preserved old APK if installing as an update. A successful build does not
replace testing on an Android device.

```powershell
$taskApk = 'E:\gloamreach-app\android\app\build\outputs\apk\debug\app-debug.apk'
$taskBuildTools = 'C:\Users\FAJAR\AppData\Local\Android\Sdk\build-tools\36.0.0'
& (Join-Path $taskBuildTools 'apksigner.bat') verify --verbose --print-certs $taskApk
& (Join-Path $taskBuildTools 'aapt2.exe') dump badging $taskApk
& (Join-Path $taskBuildTools 'apksigner.bat') verify --print-certs 'E:\New Grim Clone Factory\gloamreach-debug.apk'
Copy-Item -LiteralPath $taskApk -Destination 'E:\New Grim Clone Factory\gloamreach-act3-debug.apk'
```

Expected identity: `com.hollowlantern.gloamreach`, versionCode `2`, versionName
`3.0.0`. Debug signing is for local testing, not a Play Store release.

## Verified build result — 2026-09-29

The offline build completed successfully with 93 tasks (9 executed, 84 up-to-date).
No SDK, packages, or network downloads were needed. Existing `flatDir` and SDK XML
version warnings did not prevent the build.

- Artifact: `E:\New Grim Clone Factory\gloamreach-act3-debug.apk`
- Size: **22,177,477 bytes** (about **21.15 MiB**)
- APK SHA-256: `9c45615be1568e0aa3e6641cb17555d3563edbf359084e57b9521a2df39b27bf`
- Package: `com.hollowlantern.gloamreach`, versionCode `2`, versionName `3.0.0`
- Minimum SDK: 24; target/compile SDK: 36; portrait orientation retained
- APK Signature Scheme v2 verification: passed; one Android Debug RSA-2048 signer
- Signer certificate SHA-256: `eeb3b1f5f98f009047e21a648b4a6789c2824566d0c48a8b01b252e94c31c282`

The signer certificate matches the old APK. All **447 source runtime files** were
compared byte-for-byte against `www/`, native `assets/public/`, and the APK's
compressed entries, with **zero mismatches**. Capacitor adds only `cordova.js`
and `cordova_plugins.js` to the native public directory. The APK ZIP integrity
check passed.

The old workspace `gloamreach-debug.apk` remains unchanged:
SHA-256 `065f1e59fbdc84320195fa681ea6ad7d5d6fbbacc1e56d4bfb6dd9efe6d76023`.
The backup listed above remains available.

This verifies compilation, packaging, source parity and signing. **No emulator or
physical Android device test was performed.** Web interaction, gameplay and
offline browser checks are recorded in [release validation](release-validation.md).
