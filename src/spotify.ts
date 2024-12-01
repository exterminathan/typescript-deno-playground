// spotify_api.ts
// deno-lint-ignore-file no-explicit-any
// Import client ID and secret from local file
import { clientId, clientSecret } from "./creds.js";

export class SpotifyAPI {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor(clientId: string, clientSecret: string, redirectUri: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
    }

    getAuthorizationUrl(scopes: string[]): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            scope: scopes.join(' '),
        });
        return `https://accounts.spotify.com/authorize?${params.toString()}`;
    }

    async requestAccessToken(code: string): Promise<void> {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.redirectUri,
        });

        const headers = new Headers({
            Authorization: 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
            'Content-Type': 'application/x-www-form-urlencoded',
        });

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers,
                body: params.toString(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error exchanging authorization code:', errorData);
                throw new Error(`Failed to request access token: ${errorData.error_description}`);
            }

            const data = await response.json();
            console.log('Access Token Response:', data);

            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

            if (!this.refreshToken) {
                console.error('No refresh token provided in response:', data);
                throw new Error('Failed to obtain refresh token.');
            }
        } catch (error) {
            console.error('Error requesting access token:', error);
        }
    }

    async refreshAccessToken(): Promise<void> {
        if (!this.refreshToken) {
            console.error('No refresh token available.');
            throw new Error('No refresh token available.');
        }

        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
        });

        const headers = new Headers({
            Authorization: 'Basic ' + btoa(`${this.clientId}:${this.clientSecret}`),
            'Content-Type': 'application/x-www-form-urlencoded',
        });

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers,
                body: params.toString(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error refreshing access token:', errorData);
                throw new Error(`Failed to refresh access token: ${errorData.error_description}`);
            }

            const data = await response.json();
            console.log('Refresh Token Response:', data);

            this.accessToken = data.access_token;
            this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
        } catch (error) {
            console.error('Error refreshing access token:', error);
        }
    }

    async ensureAuthorization(scopes: string[]): Promise<void> {
        if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
            const currentUrl = new URL(globalThis.location.href);
            const code = currentUrl.searchParams.get('code');

            if (!code) {
                // Redirect to Spotify authorization URL
                const authorizationUrl = this.getAuthorizationUrl(scopes);
                globalThis.location.href = authorizationUrl;
            } else {
                // Exchange the authorization code for an access token
                await this.requestAccessToken(code);
                // Remove the code parameter from the URL to clean up
                currentUrl.searchParams.delete('code');
                globalThis.history.replaceState({}, '', currentUrl.toString());
            }
        }
    }

    async play(): Promise<void> {
        try {
            await this.ensureAuthorization(['user-modify-playback-state']);
            const headers = new Headers({
                Authorization: 'Bearer ' + this.accessToken,
                'Content-Type': 'application/json',
            });

            const response = await fetch('https://api.spotify.com/v1/me/player/play', {
                method: 'PUT',
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error playing music:', errorData);
                throw new Error(`Failed to play music: ${errorData.error.message}`);
            }

            console.log('Playback started.');
        } catch (error) {
            console.error('Error playing music:', error);
        }
    }

    async pause(): Promise<void> {
        try {
            await this.ensureAuthorization(['user-modify-playback-state']);
            const headers = new Headers({
                Authorization: 'Bearer ' + this.accessToken,
                'Content-Type': 'application/json',
            });

            const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
                method: 'PUT',
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error pausing music:', errorData);
                throw new Error(`Failed to pause music: ${errorData.error.message}`);
            }

            console.log('Playback paused.');
        } catch (error) {
            console.error('Error pausing music:', error);
        }
    }

    async getPlaybackState(): Promise<any> {
        try {
            if (!this.accessToken || Date.now() >= this.tokenExpiresAt) {
                console.log('Access token expired or missing, refreshing token...');
                await this.refreshAccessToken();
            }

            const headers = new Headers({
                Authorization: 'Bearer ' + this.accessToken,
                'Content-Type': 'application/json',
            });

            const response = await fetch('https://api.spotify.com/v1/me/player', {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error fetching playback state:', errorData);
                throw new Error(`Failed to fetch playback state: ${errorData.error.message}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching playback state:', error);
            throw error;
        }
    }

    async testConnection(): Promise<void> {
        try {
            await this.ensureAuthorization(['user-read-playback-state', 'user-modify-playback-state']);
            const playbackState = await this.getPlaybackState();
            console.log('Test Connection Playback State:', playbackState);
        } catch (error) {
            console.error('Error during test connection:', error);
        }
    }
}

// Usage Example

const redirectUri = 'http://localhost:5173/';
const spotify = new SpotifyAPI(clientId, clientSecret, redirectUri);

// Add button event listeners
document.getElementById('load')?.addEventListener('click', async () => {
    await spotify.testConnection();
    console.log('API Loaded.');
});

document.getElementById('play')?.addEventListener('click', async () => {
    await spotify.play();
});

document.getElementById('pause')?.addEventListener('click', async () => {
    await spotify.pause();
});
