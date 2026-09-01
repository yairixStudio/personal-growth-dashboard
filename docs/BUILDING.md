# Building and releasing the desktop app

Everything needed to go from a clone to an installer people can run without
Windows blocking it.

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 LTS or newer | Built and tested on 24.x |
| npm | 10 or newer | Ships with Node |
| Git | any | |
| Windows | 10/11 | Only needed to build the Windows installer |
| Xcode Command Line Tools | latest | Only to build the macOS `.dmg` |

An installer can only be produced on its own platform. Windows builds Windows,
macOS builds macOS. Cross-building is possible in theory and painful in
practice — use CI (section 8) instead.

```bash
git clone https://github.com/yairixStudio/personal-growth-dashboard.git
cd personal-growth-dashboard
npm install
```

### Windows: turn on Developer Mode first

`electron-builder` unpacks its `winCodeSign` toolchain from an archive that
contains symbolic links. Creating those needs a privilege ordinary accounts do
not have, and without it the build stops with:

```
ERROR: Cannot create symbolic link : A required privilege is not held by the client.
```

Fix it once, permanently:

**Settings → System → For developers → Developer Mode → On**

Or from an elevated PowerShell:

```powershell
New-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" `
  -Name AllowDevelopmentWithoutDevLicense -Value 1 -PropertyType DWord -Force
```

Running the build from an elevated terminal also works. Without either, only
`electron-builder --dir` succeeds — see section 4.

---

## 2. What the scripts do

| Script | What it runs |
|---|---|
| `npm run dev` | Vite dev server alone. The renderer needs the Electron preload bridge, so this is only useful together with `electron:dev`. |
| `npm run electron:dev` | Compiles the main process, starts Vite, waits for the port, launches Electron against it. Hot reload in the renderer; restart for main-process changes. |
| `npm run typecheck` | `tsc --noEmit` over both projects — the renderer (`tsconfig.json`) and the main process (`tsconfig.electron.json`). Strict in both. |
| `npm run build:renderer` | `vite build` → `dist/`. Wipes `dist/` first. |
| `npm run build:electron` | `tsc -p tsconfig.electron.json` → `dist-electron/`. |
| `npm run build` | typecheck, then both builds. This is what a release runs. |
| `npm run dist` | `npm run build` then `electron-builder` for the current platform. |
| `npm run dist:dir` | Unpacked app only, no installer. Fastest way to smoke-test a real build. |

### Why the main process compiles to `.cjs`

`package.json` sets `"type": "module"`, so a plain `.js` output would be treated
as ESM. Electron preload scripts must be CommonJS when `sandbox: true`, which
this app uses. Naming the sources `main.cts` / `preload.cts` makes TypeScript
emit `main.cjs` / `preload.cjs` regardless of the module setting, which sidesteps
the whole problem. `package.json` points `main` at `dist-electron/main.cjs`.

---

## 3. Build output

```
dist/                    renderer bundle (HTML, JS, CSS)
dist-electron/           main.cjs, preload.cjs
release/                 installers
  win-unpacked/          the app as a directory, runnable
  Personal Growth Dashboard Setup <version>.exe
```

`release/` and both `dist` directories are gitignored.

---

## 4. Building without signing

```bash
npm run build
npx electron-builder --config electron-builder.config.cjs --win nsis
```

Or, skipping the installer (this is the fallback when Developer Mode is off):

```bash
npm run dist:dir
# → release/win-unpacked/Personal Growth Dashboard.exe
```

**An unsigned build will be blocked on many Windows machines.** That is section 5.

---

## 5. The signing problem, precisely

Two different Windows features block unsigned apps, and they behave differently.
Knowing which one you are facing decides what you need to do.

### SmartScreen

> "Windows protected your PC — Microsoft Defender SmartScreen prevented an
> unrecognised app from starting."

There is a **More info → Run anyway** link. The user can bypass it per file. An
unsigned app works, it just looks alarming. Signing with any valid certificate
removes the warning once the signature builds reputation; an EV certificate or
Azure Trusted Signing removes it immediately.

### Smart App Control (Windows 11)

> "App Control blocked a potentially unsafe app."
> (Hebrew: "בקרת אפליקציות חסמה אפליקציה שעלולה להיות לא בטוחה")

**No bypass exists.** No "Run anyway", no per-file exception. It blocks every
executable that is not signed by a publisher it trusts.

Check whether it is on:

```powershell
Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\CI\Policy' `
  -Name VerifiedAndReputablePolicyState
# 0 = off   1 = enforced   2 = evaluation
```

Turning it off is a **one-way door**: Windows 11 cannot re-enable Smart App
Control without reinstalling the operating system. Do not treat that as the
solution for other people's machines — sign the app instead.

### What each option actually buys you

| Option | Cost | Hardware token | Removes SmartScreen | Passes Smart App Control |
|---|---|---|---|---|
| Unsigned | free | — | no | **no** |
| Self-signed certificate | free | no | no | **no** |
| OV certificate | ~$200–400/yr | **yes** | after reputation builds | eventually |
| EV certificate | ~$300–600/yr | **yes** | immediately | yes |
| **Azure Trusted Signing** | **~$10/month** | **no** | immediately | yes |

Self-signed certificates are worth being explicit about: they make the signature
*present* but not *trusted*. Neither SmartScreen nor Smart App Control care. They
are only useful inside an organisation that has pushed the root certificate to
its machines.

Since June 2023 the CA/Browser Forum requires OV and EV private keys to live on
FIPS 140-2 hardware, which is why both need a physical token and why neither
works cleanly in CI without a cloud HSM.

**Azure Trusted Signing is the recommended path** — cheapest, no token, and it
signs from CI.

---

## 6. Azure Trusted Signing (recommended)

### 6.1 Eligibility

Microsoft validates the publisher before issuing a certificate profile:

- **Organisation** — must be a legal entity **3 or more years old**, verified
  against public records.
- **Individual** — validated via government ID. Available in fewer regions.

If neither fits yet, the honest options are an EV certificate (section 7) or
shipping unsigned with clear instructions.

### 6.2 One-time setup in Azure

1. Create an Azure subscription if you do not have one.
2. In the portal, create a **Trusted Signing Account** — pick a region and note
   its endpoint, e.g. `https://eus.codesigning.azure.net` (East US).
3. Under that account, create an **Identity Validation** request and complete it.
   This is the part that takes days, not minutes.
4. Once validated, create a **Certificate Profile** (type: *Public Trust*). Note
   its name.
5. Create an **App Registration** in Entra ID (client ID + secret) and grant it
   the **Trusted Signing Certificate Profile Signer** role on the account.

### 6.3 Build with it

```bash
# identifies the signing account
export SIGN_AZURE_ENDPOINT="https://eus.codesigning.azure.net"
export SIGN_AZURE_ACCOUNT="your-signing-account"
export SIGN_AZURE_PROFILE="your-certificate-profile"

# authenticates to Entra ID
export AZURE_TENANT_ID="..."
export AZURE_CLIENT_ID="..."
export AZURE_CLIENT_SECRET="..."

npm run dist
```

`electron-builder.config.cjs` adds `azureSignOptions` only when the three
`SIGN_AZURE_*` variables are all present, so an ordinary local build is
unaffected.

On Windows the signing step needs PowerShell modules Microsoft publishes:

```powershell
Install-Module -Name TrustedSigning -Force -Scope CurrentUser
```

---

## 7. Traditional certificate (OV / EV)

### 7.1 From a `.pfx` file

Only possible for certificates issued before the hardware-token mandate, or for
self-signed certificates used internally.

```bash
export CSC_LINK="/absolute/path/to/certificate.pfx"   # or a base64 string
export CSC_KEY_PASSWORD="..."
export SIGN_PUBLISHER_NAME="Your Company Ltd"          # must match the cert subject
npm run dist
```

### 7.2 From a hardware token

Plug the token in, install its middleware (SafeNet, YubiKey Manager…), then let
`signtool` pick the certificate out of the Windows certificate store by subject:

```powershell
$env:SIGN_WIN_SUBJECT = "Your Company Ltd"
$env:SIGN_PUBLISHER_NAME = "Your Company Ltd"
npm run dist
```

Most tokens prompt for a PIN per signature. Tokens that allow caching the PIN
for a session are worth configuring, because a build signs several files.

### 7.3 Verifying a signature

```powershell
Get-AuthenticodeSignature ".\release\win-unpacked\Personal Growth Dashboard.exe" |
  Format-List Status, StatusMessage, SignerCertificate
```

`Status : Valid` is what you want. `NotSigned` means signing silently did not
run — check that the environment variables were actually exported in the same
shell.

```powershell
signtool verify /pa /v "path\to\file.exe"    # includes the timestamp chain
```

Always timestamp. Without it, signatures stop validating the day the certificate
expires; with it, they stay valid. The config pins DigiCert's RFC-3161 server.

---

## 8. Signing from CI

Secrets never belong in the repository. Put them in **Settings → Secrets and
variables → Actions**, then reference them.

`.github/workflows/release.yml` in this repo builds on a tag push. It signs only
if the Azure secrets exist, so forks without them still get a working unsigned
build rather than a failed one.

Secrets to set for signed Windows releases:

| Secret | From |
|---|---|
| `SIGN_AZURE_ENDPOINT` | Trusted Signing account region |
| `SIGN_AZURE_ACCOUNT` | account name |
| `SIGN_AZURE_PROFILE` | certificate profile name |
| `AZURE_TENANT_ID` | Entra ID directory |
| `AZURE_CLIENT_ID` | app registration |
| `AZURE_CLIENT_SECRET` | app registration |

For macOS releases:

| Secret | From |
|---|---|
| `CSC_LINK` | base64 of the *Developer ID Application* `.p12` |
| `CSC_KEY_PASSWORD` | its password |
| `APPLE_ID` | Apple ID e-mail |
| `APPLE_APP_SPECIFIC_PASSWORD` | appleid.apple.com → App-Specific Passwords |
| `APPLE_TEAM_ID` | Apple Developer membership |

---

## 9. macOS

An unsigned `.dmg` triggers Gatekeeper the same way SmartScreen fires on Windows,
and on Apple Silicon an unsigned app often will not open at all.

You need an **Apple Developer Program** membership ($99/yr) and a *Developer ID
Application* certificate. With `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` and
`APPLE_TEAM_ID` set, the config turns notarisation on automatically:

```bash
export CSC_LINK="/path/to/DeveloperID.p12"
export CSC_KEY_PASSWORD="..."
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="abcd-efgh-ijkl-mnop"
export APPLE_TEAM_ID="XXXXXXXXXX"
npm run dist
```

Notarisation uploads the build to Apple and usually returns within minutes. The
build fails if Apple rejects it, which is the point.

Check the result:

```bash
spctl -a -vvv -t install "release/mac/Personal Growth Dashboard.app"
codesign -dv --verbose=4 "release/mac/Personal Growth Dashboard.app"
```

---

## 10. Linux

No signing infrastructure to speak of. The AppImage runs after `chmod +x`.

```bash
npm run dist
chmod +x "release/Personal Growth Dashboard-<version>.AppImage"
```

---

## 11. Release checklist

1. `npm run typecheck` — clean.
2. Bump `version` in `package.json`.
3. `npm run dist` with signing variables set.
4. Verify the signature (section 7.3).
5. Install from the produced installer on a clean machine — ideally one with
   Smart App Control **on**, which is the only real proof it is fixed.
6. Tag and push: `git tag v2.1.0 && git push --tags`.

---

## 12. Troubleshooting

**`Cannot create symbolic link : A required privilege is not held`**
Developer Mode is off. Section 1. Or use `npm run dist:dir`.

**`'electron-builder' is not recognized`**
`npm install` did not finish. Re-run it.

**App starts, window is blank**
The renderer was not built, or was built after packaging. Run `npm run build`
before `electron-builder`, which `npm run dist` does for you.

**App starts in dev but not when packaged**
`isDev()` in `electron/main.cts` decides between the Vite URL and
`dist/index.html`. To test the packaged bundle without packaging:
`NODE_ENV=production npx electron .`

**Vision-board or background images do not appear**
They are served over the custom `media://` scheme, registered in `main.cts` and
resolved only inside the app's user-data directories. If images vanished, check
that `%APPDATA%/personal-growth-dashboard/vision-board` still holds the files —
the store keeps filenames, not the images themselves.

**`Status : NotSigned` after a signed build**
The environment variables were not visible to the build process. On Windows,
`$env:X = "..."` applies to the current PowerShell session only; a new terminal
loses it.

**Smart App Control still blocks a signed build**
Give the signature time to propagate, and confirm the certificate is *public
trust* rather than private trust. Verify with `signtool verify /pa /v`.

---

## 13. Where the app keeps its data

| Path | Contents |
|---|---|
| `%APPDATA%/personal-growth-dashboard/personal-growth.json` | workspaces, panels, settings |
| `%APPDATA%/personal-growth-dashboard/vision-board/` | vision-board images |
| `%APPDATA%/personal-growth-dashboard/backgrounds/` | background wallpapers |

On macOS, `~/Library/Application Support/personal-growth-dashboard/`.
On Linux, `~/.config/personal-growth-dashboard/`.

Uninstalling does not remove these. Delete the directory to reset the app
completely.
