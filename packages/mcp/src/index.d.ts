#!/usr/bin/env node
export declare const TOOLS: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
            chainId: {
                type: string;
                description: string;
            };
            sort: {
                type: string;
                enum: string[];
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
            address?: undefined;
            id?: undefined;
            fetAmount?: undefined;
            tokenAmount?: undefined;
            name?: undefined;
            symbol?: undefined;
            description?: undefined;
            logo?: undefined;
            tokenId?: undefined;
            action?: undefined;
            amount?: undefined;
            type?: undefined;
            outputDir?: undefined;
            apiKey?: undefined;
            agentFile?: undefined;
            agentName?: undefined;
            secrets?: undefined;
            agentAddress?: undefined;
            image?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            address: {
                type: string;
                description: string;
            };
            id: {
                type: string;
                description: string;
            };
            status?: undefined;
            category?: undefined;
            chainId?: undefined;
            sort?: undefined;
            limit?: undefined;
            offset?: undefined;
            fetAmount?: undefined;
            tokenAmount?: undefined;
            name?: undefined;
            symbol?: undefined;
            description?: undefined;
            logo?: undefined;
            tokenId?: undefined;
            action?: undefined;
            amount?: undefined;
            type?: undefined;
            outputDir?: undefined;
            apiKey?: undefined;
            agentFile?: undefined;
            agentName?: undefined;
            secrets?: undefined;
            agentAddress?: undefined;
            image?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            status?: undefined;
            category?: undefined;
            chainId?: undefined;
            sort?: undefined;
            limit?: undefined;
            offset?: undefined;
            address?: undefined;
            id?: undefined;
            fetAmount?: undefined;
            tokenAmount?: undefined;
            name?: undefined;
            symbol?: undefined;
            description?: undefined;
            logo?: undefined;
            tokenId?: undefined;
            action?: undefined;
            amount?: undefined;
            type?: undefined;
            outputDir?: undefined;
            apiKey?: undefined;
            agentFile?: undefined;
            agentName?: undefined;
            secrets?: undefined;
            agentAddress?: undefined;
            image?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            address: {
                type: string;
                description: string;
            };
            fetAmount: {
                type: string;
                description: string;
            };
            status?: undefined;
            category?: undefined;
            chainId?: undefined;
            sort?: undefined;
            limit?: undefined;
            offset?: undefined;
            id?: undefined;
            tokenAmount?: undefined;
            name?: undefined;
            symbol?: undefined;
            description?: undefined;
            logo?: undefined;
            tokenId?: undefined;
            action?: undefined;
            amount?: undefined;
            type?: undefined;
            outputDir?: undefined;
            apiKey?: undefined;
            agentFile?: undefined;
            agentName?: undefined;
            secrets?: undefined;
            agentAddress?: undefined;
            image?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            address: {
                type: string;
                description: string;
            };
            tokenAmount: {
                type: string;
                description: string;
            };
            status?: undefined;
            category?: undefined;
            chainId?: undefined;
            sort?: undefined;
            limit?: undefined;
            offset?: undefined;
            id?: undefined;
            fetAmount?: undefined;
            name?: undefined;
            symbol?: undefined;
            description?: undefined;
            logo?: undefined;
            tokenId?: undefined;
            action?: undefined;
            amount?: undefined;
            type?: undefined;
            outputDir?: undefined;
            apiKey?: undefined;
            agentFile?: undefined;
            agentName?: undefined;
            secrets?: undefined;
            agentAddress?: undefined;
            image?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            symbol: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                description: string;
            };
            logo: {
                type: string;
                description: string;
            };
            chainId: {
                type: string;
                description: string;
            };
            status?: undefined;
            sort?: undefined;
            limit?: undefined;
            offset?: undefined;
            address?: undefined;
            id?: undefined;
            fetAmount?: undefined;
            tokenAmount?: undefined;
            tokenId?: undefined;
            action?: undefined;
            amount?: undefined;
            type?: undefined;
            outputDir?: undefined;
            apiKey?: undefined;
            agentFile?: undefined;
            agentName?: undefined;
            secrets?: undefined;
            agentAddress?: undefined;
            image?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            tokenId: {
                type: string;
                description: string;
            };
            status?: undefined;
            category?: undefined;
            chainId?: undefined;
            sort?: undefined;
            limit?: undefined;
            offset?: undefined;
            address?: undefined;
            id?: undefined;
            fetAmount?: undefined;
            tokenAmount?: undefined;
            name?: undefined;
            symbol?: undefined;
            description?: undefined;
            logo?: undefined;
            action?: undefined;
            amount?: undefined;
            type?: undefined;
            outputDir?: undefined;
            apiKey?: undefined;
            agentFile?: undefined;
            agentName?: undefined;
            secrets?: undefined;
            agentAddress?: undefined;
            image?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            address: {
                type: string;
                description: string;
            };
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            amount: {
                type: string;
                description: string;
            };
            status?: undefined;
            category?: undefined;
            chainId?: undefined;
            sort?: undefined;
            limit?: undefined;
            offset?: undefined;
            id?: undefined;
            fetAmount?: undefined;
            tokenAmount?: undefined;
            name?: undefined;
            symbol?: undefined;
            description?: undefined;
            logo?: undefined;
            tokenId?: undefined;
            type?: undefined;
            outputDir?: undefined;
            apiKey?: undefined;
            agentFile?: undefined;
            agentName?: undefined;
            secrets?: undefined;
            agentAddress?: undefined;
            image?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            outputDir: {
                type: string;
                description: string;
            };
            status?: undefined;
            category?: undefined;
            chainId?: undefined;
            sort?: undefined;
            limit?: undefined;
            offset?: undefined;
            address?: undefined;
            id?: undefined;
            fetAmount?: undefined;
            tokenAmount?: undefined;
            symbol?: undefined;
            description?: undefined;
            logo?: undefined;
            tokenId?: undefined;
            action?: undefined;
            amount?: undefined;
            apiKey?: undefined;
            agentFile?: undefined;
            agentName?: undefined;
            secrets?: undefined;
            agentAddress?: undefined;
            image?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            apiKey: {
                type: string;
                description: string;
            };
            agentFile: {
                type: string;
                description: string;
            };
            agentName: {
                type: string;
                description: string;
            };
            secrets: {
                type: string;
                description: string;
                additionalProperties: {
                    type: string;
                };
            };
            status?: undefined;
            category?: undefined;
            chainId?: undefined;
            sort?: undefined;
            limit?: undefined;
            offset?: undefined;
            address?: undefined;
            id?: undefined;
            fetAmount?: undefined;
            tokenAmount?: undefined;
            name?: undefined;
            symbol?: undefined;
            description?: undefined;
            logo?: undefined;
            tokenId?: undefined;
            action?: undefined;
            amount?: undefined;
            type?: undefined;
            outputDir?: undefined;
            agentAddress?: undefined;
            image?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            apiKey: {
                type: string;
                description: string;
            };
            agentAddress: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            symbol: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            image: {
                type: string;
                description: string;
            };
            chainId: {
                type: string;
                description: string;
            };
            status?: undefined;
            category?: undefined;
            sort?: undefined;
            limit?: undefined;
            offset?: undefined;
            address?: undefined;
            id?: undefined;
            fetAmount?: undefined;
            tokenAmount?: undefined;
            logo?: undefined;
            tokenId?: undefined;
            action?: undefined;
            amount?: undefined;
            type?: undefined;
            outputDir?: undefined;
            agentFile?: undefined;
            agentName?: undefined;
            secrets?: undefined;
        };
        required: string[];
    };
})[];
//# sourceMappingURL=index.d.ts.map