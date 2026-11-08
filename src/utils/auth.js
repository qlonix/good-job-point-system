/**
 * WebAuthn (Passkey) utility for shared authentication logic
 */
import { getPasskeys, savePasskeys } from '../data/store';

function getStoredPasskeyIds() {
  const serverKeys = getPasskeys() || [];
  const serverIds = serverKeys.map(k => (typeof k === 'string' ? k : k.id)).filter(Boolean);
  const localId = localStorage.getItem('gj_credential_id');
  const allIds = [...new Set([...serverIds, ...(localId ? [localId] : [])])];
  return allIds;
}

export function isPasskeyRegistered() {
  return getStoredPasskeyIds().length > 0;
}

export async function clearPasskeys() {
  localStorage.removeItem('gj_credential_id');
  await savePasskeys([]);
}

export async function deletePasskey(id) {
  if (localStorage.getItem('gj_credential_id') === id) {
    localStorage.removeItem('gj_credential_id');
  }
  const current = getPasskeys() || [];
  const next = current.filter(k => (typeof k === 'string' ? k : k.id) !== id);
  await savePasskeys(next);
}

export async function checkPasskeySupport() {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
    return false;
  }
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return true;
  }
}

export async function authenticatePasskey() {
  const ids = getStoredPasskeyIds();
  const allowCredentials = ids.map(id => {
    try {
      return {
        id: Uint8Array.from(atob(id), c => c.charCodeAt(0)),
        type: 'public-key'
      };
    } catch {
      return null;
    }
  }).filter(Boolean);

  try {
    const challenge = new Uint8Array(32);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(challenge);
    }

    const publicKeyOptions = {
      challenge,
      userVerification: 'required',
      timeout: 60000,
    };

    if (allowCredentials.length > 0) {
      publicKeyOptions.allowCredentials = allowCredentials;
    }

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions
    });
    return assertion;
  } catch (e) {
    console.error('Passkey authentication failed:', e);
    throw e;
  }
}

export async function registerPasskey(label = '') {
  try {
    const challenge = new Uint8Array(32);
    const userId = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(challenge);
      window.crypto.getRandomValues(userId);
    }

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'がんばったねポイント' },
        user: {
          id: userId,
          name: 'admin',
          displayName: label || '管理者パスキー',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    });
    if (credential) {
      const idBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem('gj_credential_id', idBase64);

      const current = getPasskeys() || [];
      const exists = current.some(k => (typeof k === 'string' ? k : k.id) === idBase64);
      if (!exists) {
        const next = [
          ...current,
          {
            id: idBase64,
            name: label || `パスキー (${new Date().toLocaleDateString('ja-JP')})`,
            createdAt: new Date().toISOString()
          }
        ];
        await savePasskeys(next);
      }
      return credential;
    }
    return null;
  } catch (e) {
    console.error('Passkey registration failed:', e);
    throw e;
  }
}

// Backward-compatible aliases
export const isBiometricRegistered = isPasskeyRegistered;
export const clearBiometric = clearPasskeys;
export const checkBiometricSupport = checkPasskeySupport;
export const authenticateBiometric = authenticatePasskey;
export const registerBiometric = registerPasskey;

