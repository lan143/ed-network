import { LitElement } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import type { NetworkStatus } from '../api/types';
export declare class EdnNetworkStatus extends LitElement {
    static properties: {
        baseUrl: {
            type: StringConstructor;
            attribute: string;
        };
        pollIntervalMs: {
            type: NumberConstructor;
            attribute: string;
        };
        status: {
            state: boolean;
        };
        errorMessage: {
            state: boolean;
        };
        lastUpdated: {
            state: boolean;
        };
        loading: {
            state: boolean;
        };
    };
    static styles: import("lit").CSSResult;
    /** Prefix for API requests. Empty string means same origin. */
    baseUrl: string;
    /** Auto-refresh period in ms. 0 disables polling. */
    pollIntervalMs: number;
    status?: NetworkStatus;
    errorMessage: string;
    lastUpdated?: Date;
    loading: boolean;
    private timerId?;
    private client?;
    private clientBaseUrl?;
    /** Monotonic token so a slow refresh result never overwrites a newer one. */
    private refreshSeq;
    connectedCallback(): void;
    disconnectedCallback(): void;
    updated(changed: PropertyValues<this>): void;
    render(): TemplateResult;
    private renderSections;
    private renderWifi;
    private renderAp;
    private renderEthernet;
    private row;
    private ensureClient;
    private refresh;
    private startPolling;
    private stopPolling;
    private handleRetry;
}
