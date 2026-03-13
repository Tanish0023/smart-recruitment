declare module 'apollo-upload-client/UploadHttpLink.mjs' {
    import { ApolloLink } from '@apollo/client';
    import { BaseHttpLink } from '@apollo/client/link/http';

    export interface UploadHttpLinkOptions {
        uri?: string;
        useGETForQueries?: boolean;
        isExtractableFile?: (value: any) => value is File | Blob;
        FormData?: typeof FormData;
        formDataAppendFile?: (formData: FormData, fieldName: string, file: any) => any;
        print?: any;
        fetch?: typeof fetch;
        fetchOptions?: RequestInit;
        credentials?: string;
        headers?: Record<string, string>;
        includeExtensions?: boolean;
        includeUnusedVariables?: boolean;
    }

    export default class UploadHttpLink extends ApolloLink {
        constructor(options?: UploadHttpLinkOptions);
    }
}
