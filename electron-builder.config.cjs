/**
 * electron-builder configuration.
 *
 * Signing is opt-in and driven entirely by environment variables, so the same
 * command produces an unsigned local build or a signed release build depending
 * on what is set. Nothing secret lives in this file.
 *
 *   Azure Trusted Signing (recommended — no hardware token):
 *     SIGN_AZURE_ENDPOINT, SIGN_AZURE_ACCOUNT, SIGN_AZURE_PROFILE
 *     plus AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET
 *
 *   Certificate file (.pfx — OV certs issued before the token mandate, or a
 *   self-signed cert for internal use):
 *     CSC_LINK, CSC_KEY_PASSWORD          (electron-builder reads these itself)
 *
 *   Hardware token / cert already in the Windows certificate store:
 *     SIGN_WIN_SUBJECT  — the certificate's subject name
 *
 *   macOS notarisation:
 *     APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID
 *
 * See docs/BUILDING.md for how to obtain each of these.
 */

const {
  SIGN_AZURE_ENDPOINT,
  SIGN_AZURE_ACCOUNT,
  SIGN_AZURE_PROFILE,
  SIGN_WIN_SUBJECT,
  SIGN_PUBLISHER_NAME,
  APPLE_ID,
} = process.env;

/** Exactly one Windows signing method, or none. */
function windowsSigning() {
  if (SIGN_AZURE_ENDPOINT && SIGN_AZURE_ACCOUNT && SIGN_AZURE_PROFILE) {
    return {
      azureSignOptions: {
        endpoint: SIGN_AZURE_ENDPOINT,
        codeSigningAccountName: SIGN_AZURE_ACCOUNT,
        certificateProfileName: SIGN_AZURE_PROFILE,
      },
    };
  }

  if (SIGN_WIN_SUBJECT) {
    return {
      signtoolOptions: {
        certificateSubjectName: SIGN_WIN_SUBJECT,
        signingHashAlgorithms: ['sha256'],
        rfc3161TimeStampServer: 'http://timestamp.digicert.com',
        ...(SIGN_PUBLISHER_NAME ? { publisherName: SIGN_PUBLISHER_NAME } : {}),
      },
    };
  }

  // CSC_LINK / CSC_KEY_PASSWORD are picked up by electron-builder on their own;
  // only the timestamp server and publisher name are worth pinning here.
  if (process.env.CSC_LINK) {
    return {
      signtoolOptions: {
        signingHashAlgorithms: ['sha256'],
        rfc3161TimeStampServer: 'http://timestamp.digicert.com',
        ...(SIGN_PUBLISHER_NAME ? { publisherName: SIGN_PUBLISHER_NAME } : {}),
      },
    };
  }

  return {};
}

module.exports = {
  appId: 'com.yairix.personal-growth-dashboard',
  productName: 'Personal Growth Dashboard',
  copyright: `Copyright © ${new Date().getFullYear()} Yairix Studio`,

  directories: {
    output: 'release',
    buildResources: 'build-resources',
  },

  // Only what the app needs at runtime. Sources and configs stay out.
  files: ['dist/**/*', 'dist-electron/**/*', 'package.json', '!**/*.map'],

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    ...windowsSigning(),
  },

  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Personal Growth Dashboard',
  },

  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    category: 'public.app-category.productivity',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    // Notarisation needs an Apple ID; without one the build stays unnotarised.
    notarize: Boolean(APPLE_ID),
  },

  linux: {
    target: ['AppImage'],
    category: 'Utility',
  },
};
