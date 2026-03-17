declare module 'apollo-upload-client/UploadHttpLink.mjs' {
    import { ApolloLink } from '@apollo/client';

    export interface UploadHttpLinkOptions {
        uri?: string;
        useGETForQueries?: boolean;
        isExtractableFile?: (value: unknown) => value is File | Blob;
        FormData?: typeof FormData;
        formDataAppendFile?: (formData: FormData, fieldName: string, file: unknown) => void;
        print?: (value: unknown) => string;
        fetch?: typeof fetch;
        fetchOptions?: RequestInit;
        credentials?: RequestCredentials;
        headers?: Record<string, string>;
        includeExtensions?: boolean;
        includeUnusedVariables?: boolean;
    }

    export default class UploadHttpLink extends ApolloLink {
        constructor(options?: UploadHttpLinkOptions);
    }
}
