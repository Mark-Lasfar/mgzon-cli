export interface CliConfig {
    apiKey?: string;
    apiUrl?: string;
    defaultEnvironment?: 'development' | 'staging' | 'production' | 'sandbox';
    userId?: string;
    email?: string;
    name?: string;
    role?: string;
    isDeveloper?: boolean;
    isSeller?: boolean;
    isAdmin?: boolean;
    theme?: string;
    editor?: string;
    currentProject?: string;
    lastLogin?: string;
    sessionToken?: string;
    expiresAt?: string;
    useLocalhost?: boolean;
    useNgrok?: boolean;
    ngrokUrl?: string;
}
export declare function getConfig(): Promise<CliConfig>;
export declare function saveConfig(config: Partial<CliConfig>): Promise<{
    apiKey?: string;
    apiUrl?: string;
    defaultEnvironment?: "development" | "staging" | "production" | "sandbox";
    userId?: string;
    email?: string;
    name?: string;
    role?: string;
    isDeveloper?: boolean;
    isSeller?: boolean;
    isAdmin?: boolean;
    theme?: string;
    editor?: string;
    currentProject?: string;
    lastLogin?: string;
    sessionToken?: string;
    expiresAt?: string;
    useLocalhost?: boolean;
    useNgrok?: boolean;
    ngrokUrl?: string;
}>;
export declare function getApiUrl(): Promise<string>;
export declare function autoDetectConnection(): Promise<{
    type: 'localhost' | 'ngrok' | 'ip' | 'unknown';
    url: string;
    reachable: boolean;
}>;
export declare function setupWizard(): Promise<void>;
export declare function loginCommand(apiKey: string): Promise<any>;
export declare function getApiKey(): Promise<string | undefined>;
export declare function getBaseUrl(): Promise<string>;
export declare function verifyApiKey(apiKey: string): Promise<any>;
export declare function testApiConnection(): Promise<{
    success: boolean;
    url: string;
    error?: string;
}>;
export declare function logout(): Promise<{
    apiKey?: string;
    apiUrl?: string;
    defaultEnvironment?: "development" | "staging" | "production" | "sandbox";
    userId?: string;
    email?: string;
    name?: string;
    role?: string;
    isDeveloper?: boolean;
    isSeller?: boolean;
    isAdmin?: boolean;
    theme?: string;
    editor?: string;
    currentProject?: string;
    lastLogin?: string;
    sessionToken?: string;
    expiresAt?: string;
    useLocalhost?: boolean;
    useNgrok?: boolean;
    ngrokUrl?: string;
}>;
export declare function isAuthenticated(): Promise<boolean>;
export declare function getUserInfo(): Promise<{
    email: string | undefined;
    name: string | undefined;
    userId: string | undefined;
    role: string | undefined;
    isDeveloper: boolean | undefined;
    isSeller: boolean | undefined;
    isAdmin: boolean | undefined;
    apiUrl: string | undefined;
}>;
export declare function getCurrentProject(): Promise<{
    path: string;
    valid: boolean;
} | null>;
export declare function setCurrentProject(projectPath: string): Promise<void>;
export declare function clearCurrentProject(): Promise<void>;
export declare function getProjectConfig(projectPath: string): Promise<any>;
export declare function saveProjectConfig(projectPath: string, config: any): Promise<void>;
export declare function checkForUpdates(): Promise<void>;
export declare function validateApiEndpoints(): Promise<{
    health: string;
    webhooks: string;
    apps: string;
    auth: string;
}>;
export declare function testAllEndpoints(): Promise<Record<string, boolean>>;
//# sourceMappingURL=config.d.ts.map