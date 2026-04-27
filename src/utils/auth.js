/**
 * WebAuthn (Passkey) utility for shared authentication logic
 */

export function isBiometricRegistered() {
  return !!localStorage.getItem('gj_credential_id');
}

export function clearBiometric() {
  localStorage.removeItem('gj_credential_id');
}

export async function checkBiometricSupport() {
  return window.PublicKeyCredential && 
         navigator.credentials && 
         (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
}

export async function authenticateBiometric() {
  const storedId = localStorage.getItem('gj_credential_id');
  if (!storedId) return null;

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        allowCredentials: [{
          id: Uint8Array.from(atob(storedId), c => c.charCodeAt(0)),
          type: 'public-key'
        }],
        userVerification: 'required',
        timeout: 60000,
      }
    });
    return assertion;
  } catch (e) {
    console.error('Authentication failed:', e);
    throw e;
  }
}

export async function registerBiometric() {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32),
        rp: { name: 'がんばったねポイント' },
        user: {
          id: new Uint8Array(16),
          name: 'parent',
          displayName: 'おやの にんしょう',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    });
    if (credential) {
      const idBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem('gj_credential_id', idBase64);
      return credential;
    }
    return null;
  } catch (e) {
    console.error('Registration failed:', e);
    throw e;
  }
}
