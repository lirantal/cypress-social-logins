export declare function GoogleSocialLogin(options?: {}): Promise<{
    cookies: any;
    lsd: any;
    ssd: any;
}>;
export declare function GitHubSocialLogin(options?: {}): Promise<{
    cookies: any;
    lsd: any;
    ssd: any;
}>;
export declare function MicrosoftSocialLogin(options?: {}): Promise<{
    cookies: any;
    lsd: any;
    ssd: any;
}>;
export declare function AmazonSocialLogin(options?: {}): Promise<{
    cookies: any;
    lsd: any;
    ssd: any;
}>;
export declare function FacebookSocialLogin(options?: {}): Promise<{
    cookies: any;
    lsd: any;
    ssd: any;
}>;
export declare function CustomizedLogin(options?: {}): Promise<{
    cookies: any;
    lsd: any;
    ssd: any;
}>;
export declare function baseLoginConnect(typeUsername: function, typePassword: function, otpApp: function | null, authorizeApp: function | null, postLogin: function, options: {}): Promise<{
    cookies: any;
    lsd: any;
    ssd: any;
}>;
