/**
 * WebAuthn Service
 * Handles biometric authentication using FIDO2/WebAuthn
 */

import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';

const API_BASE = '/api/webauthn';

export interface WebAuthnCredential {
  id: string;
  device_name: string;
  transports: string[];
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

/**
 * Check if WebAuthn is supported in this browser
 */
export const isWebAuthnSupported = (): boolean => {
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    navigator.credentials.create
  );
};

/**
 * Check if platform authenticator (biometric) is available
 */
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false;
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

/**
 * Register a new biometric credential
 */
export const registerBiometric = async (
  deviceName: string = 'מכשיר זה'
): Promise<{ success: boolean; credential_id?: string; error?: string }> => {
  try {
    // Check support
    if (!isWebAuthnSupported()) {
      throw new Error('הדפדפן שלך אינו תומך באימות ביומטרי');
    }

    const isPlatformAvailable = await isPlatformAuthenticatorAvailable();
    if (!isPlatformAvailable) {
      throw new Error('אימות ביומטרי אינו זמין במכשיר זה');
    }

    // Get registration options from server
    const optionsResponse = await fetch(`${API_BASE}/register/begin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!optionsResponse.ok) {
      const error = await optionsResponse.json();
      throw new Error(error.error || 'שגיאה בקבלת אפשרויות רישום');
    }

    const options = await optionsResponse.json();

    // Start registration with browser
    let attResp: RegistrationResponseJSON;
    try {
      attResp = await startRegistration(options);
    } catch (error: any) {
      if (error.name === 'InvalidStateError') {
        throw new Error('מכשיר זה כבר רשום');
      } else if (error.name === 'NotAllowedError') {
        throw new Error('הרישום בוטל או נכשל');
      }
      throw error;
    }

    // Send credential to server
    const verificationResponse = await fetch(`${API_BASE}/register/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({
        ...attResp,
        device_name: deviceName,
      }),
    });

    if (!verificationResponse.ok) {
      const error = await verificationResponse.json();
      throw new Error(error.error || 'שגיאה באימות הרישום');
    }

    const result = await verificationResponse.json();
    return {
      success: true,
      credential_id: result.credential_id,
    };
  } catch (error: any) {
    console.error('WebAuthn registration error:', error);
    return {
      success: false,
      error: error.message || 'שגיאה ברישום ביומטרי',
    };
  }
};

/**
 * Authenticate using biometric credential
 */
export const authenticateBiometric = async (
  username: string
): Promise<{
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  user?: any;
  error?: string;
}> => {
  try {
    // Check support
    if (!isWebAuthnSupported()) {
      throw new Error('הדפדפן שלך אינו תומך באימות ביומטרי');
    }

    // Get authentication options from server
    const optionsResponse = await fetch(`${API_BASE}/authenticate/begin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    if (!optionsResponse.ok) {
      const error = await optionsResponse.json();
      throw new Error(error.error || 'שגיאה בקבלת אפשרויות אימות');
    }

    const options = await optionsResponse.json();

    // Start authentication with browser
    let asseResp: AuthenticationResponseJSON;
    try {
      asseResp = await startAuthentication(options);
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        throw new Error('האימות בוטל או נכשל');
      }
      throw error;
    }

    // Send assertion to server
    const verificationResponse = await fetch(`${API_BASE}/authenticate/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(asseResp),
    });

    if (!verificationResponse.ok) {
      const error = await verificationResponse.json();
      throw new Error(error.error || 'שגיאה באימות');
    }

    const result = await verificationResponse.json();
    
    // Store tokens
    if (result.access_token) {
      localStorage.setItem('access_token', result.access_token);
    }
    if (result.refresh_token) {
      localStorage.setItem('refresh_token', result.refresh_token);
    }

    return {
      success: true,
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      user: result.user,
    };
  } catch (error: any) {
    console.error('WebAuthn authentication error:', error);
    return {
      success: false,
      error: error.message || 'שגיאה באימות ביומטרי',
    };
  }
};

/**
 * Get list of registered credentials
 */
export const getCredentials = async (): Promise<WebAuthnCredential[]> => {
  try {
    const response = await fetch(`${API_BASE}/credentials`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('שגיאה בקבלת רשימת מכשירים');
    }

    const data = await response.json();
    return data.credentials || [];
  } catch (error) {
    console.error('Get credentials error:', error);
    return [];
  }
};

/**
 * Delete a registered credential
 */
export const deleteCredential = async (credentialId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/credentials/${credentialId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Delete credential error:', error);
    return false;
  }
};

/**
 * Rename a registered credential
 */
export const renameCredential = async (
  credentialId: string,
  newName: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/credentials/${credentialId}/rename`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({ device_name: newName }),
    });

    return response.ok;
  } catch (error) {
    console.error('Rename credential error:', error);
    return false;
  }
};

/**
 * Get device info for naming
 */
export const getDeviceInfo = (): string => {
  const ua = navigator.userAgent;
  
  if (/iPhone|iPad|iPod/.test(ua)) {
    return 'iPhone/iPad';
  } else if (/Android/.test(ua)) {
    return 'Android';
  } else if (/Windows/.test(ua)) {
    return 'Windows PC';
  } else if (/Mac/.test(ua)) {
    return 'Mac';
  } else if (/Linux/.test(ua)) {
    return 'Linux';
  }
  
  return 'מכשיר לא ידוע';
};
