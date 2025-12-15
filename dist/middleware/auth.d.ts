interface AuthInfo {
    apiKey: string;
    apiUrl: string;
    user?: any;
    rateLimit?: any;
}
export declare function requireAuth(silent?: boolean): Promise<AuthInfo | null>;
export declare function getAuthHeaders(): Promise<{
    Authorization: string;
    'Content-Type': string;
    'User-Agent': string;
    'X-CLI-Version': string;
}>;
export declare function buildApiUrl(endpoint: string): Promise<string>;
export declare function getApiUserInfo(): Promise<any>;
export {};
//# sourceMappingURL=auth.d.ts.map