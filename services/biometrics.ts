import {
  bufferToString,
  stringToBuffer,
  bufferToBase64,
  base64ToBuffer,
} from './encoding';

const BIOMETRIC_CREDENTIAL_ID_KEY = 'biometric_credential_id';
const BIOMETRIC_USER_ID_KEY = 'biometric_user_id';

/**
 * Checks if WebAuthn is supported by the browser.
 */
export const isBiometricSupportAvailable = (): boolean => {
  return window.PublicKeyCredential !== undefined && typeof window.PublicKeyCredential === 'function';
};

/**
 * Checks if a biometric credential has already been registered and stored.
 */
export const isBiometricRegistered = (): boolean => {
  return !!localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
};

/**
 * Creates a new biometric credential for the user.
 */
export const registerBiometricCredential = async (): Promise<boolean> => {
  try {
    // 1. Create a user ID or retrieve an existing one
    let userId = localStorage.getItem(BIOMETRIC_USER_ID_KEY);
    if (!userId) {
      userId = bufferToBase64(crypto.getRandomValues(new Uint8Array(16)));
      localStorage.setItem(BIOMETRIC_USER_ID_KEY, userId);
    }

    // 2. Define credential options
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: {
        name: "Rifas TEUCO",
        // Explicitly setting the relying party ID to the current hostname
        // helps resolve origin issues when the app is running in an iframe.
        id: window.location.hostname,
      },
      user: {
        id: base64ToBuffer(userId),
        name: "usuario@rifasteuco",
        displayName: "Usuário Rifas TEUCO",
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }], // ES256
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    };

    // 3. Create the credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    }) as PublicKeyCredential;

    // 4. Store the credential ID for future logins
    if (credential && credential.rawId) {
      const credentialIdBase64 = bufferToBase64(credential.rawId);
      localStorage.setItem(BIOMETRIC_CREDENTIAL_ID_KEY, credentialIdBase64);
      return true;
    }
    return false;

  } catch (error) {
    console.error("Biometric registration failed:", error);
    return false;
  }
};

/**
 * Authenticates the user using a previously registered biometric credential.
 */
export const authenticateWithBiometrics = async (): Promise<boolean> => {
  try {
    const credentialIdBase64 = localStorage.getItem(BIOMETRIC_CREDENTIAL_ID_KEY);
    if (!credentialIdBase64) {
      return false;
    }

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rpId: window.location.hostname, // Set RP ID for authentication as well.
      allowCredentials: [{
        type: 'public-key',
        id: base64ToBuffer(credentialIdBase64),
        transports: ['internal'],
      }],
      timeout: 60000,
      userVerification: 'required',
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    });

    return !!assertion;
  } catch (error) {
    console.error("Biometric authentication failed:", error);
    return false;
  }
};

/**
 * Removes the stored biometric credential information.
 */
export const unregisterBiometricCredential = (): void => {
  localStorage.removeItem(BIOMETRIC_CREDENTIAL_ID_KEY);
  // Optional: You might want to keep the user ID for re-registration
  // localStorage.removeItem(BIOMETRIC_USER_ID_KEY);
};
