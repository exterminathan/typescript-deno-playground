// spotify_auth_pkce.ts

// Utility to get the correct redirect URI based on the environment
const getRedirectURI = () => {
    const currentHost = globalThis.location.origin;
    console.log(currentHost);
    if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
        return 'http://localhost:5173/';
    }
    return 'https://exterminathan.github.io';
};

// Utility to generate a random string
const generateRandomString = (length: number) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, value) => acc + charset[value % charset.length], '');
};

// Generate or retrieve the code verifier
const getCodeVerifier = () => {
    let codeVerifier = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
        codeVerifier = generateRandomString(64);
        sessionStorage.setItem('code_verifier', codeVerifier);
    }
    return codeVerifier;
};

const codeVerifier = getCodeVerifier();

// SHA-256 hashing function
// deno-lint-ignore require-await
const sha256 = async (plain: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return globalThis.crypto.subtle.digest('SHA-256', data);
};

// Base64 URL encoding
const base64encode = (input: ArrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};

// Utility to get code challenge
const getCodeChallenge = async () => {
    const hash = await sha256(codeVerifier);
    return base64encode(hash);
};


// Spotify client ID and redirect URI
const clientId = '7e524fae1f6b426bbb13bc3770d0ed8f'; // Replace with your Spotify Client ID
const redirectUri = getRedirectURI(); // Replace with your GitHub Pages URL

// Generate code challenge asynchronously
let codeChallenge: string;
(async () => {
    codeChallenge = await getCodeChallenge();
    console.log(codeChallenge);
})();



export const getAuthUrl = (scopes: string[]) => {
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('scope', scopes.join(' '));

    return authUrl.toString();
};

// deno-lint-ignore no-explicit-any
export const exchangeToken = async (code: string): Promise<any> => {
    const tokenUrl = 'https://accounts.spotify.com/api/token';

    // Retrieve code_verifier from sessionStorage
    const codeVerifier = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
        throw new Error('Code verifier not found in sessionStorage.');
    }

    const body = new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
    });

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Error exchanging code for tokens:', errorData);
        throw new Error(`Failed to exchange token: ${errorData.error_description}`);
    }

    const tokenData = await response.json();

    // Remove code_verifier from sessionStorage after successful exchange
    sessionStorage.removeItem('code_verifier');

    return tokenData;
};

// deno-lint-ignore no-explicit-any
export const refreshToken = async (refreshToken: string): Promise<any> => {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    });

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Error refreshing token:', errorData);
        throw new Error(`Failed to refresh token: ${errorData.error_description}`);
    }

    return await response.json();
};
