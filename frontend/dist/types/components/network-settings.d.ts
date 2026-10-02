import { LitElement } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import type { NetworkSettings, WifiNetwork } from '../api/types';
type Mode = 'station' | 'ap';
interface FieldErrors {
    wifiSSID?: string;
    wifiPassword?: string;
    wifiAPSSID?: string;
    wifiAPPassword?: string;
}
export declare class EdnNetworkSettings extends LitElement {
    static properties: {
        baseUrl: {
            type: StringConstructor;
            attribute: string;
        };
        settings: {
            state: boolean;
        };
        loading: {
            state: boolean;
        };
        submitting: {
            state: boolean;
        };
        errorMessage: {
            state: boolean;
        };
        successMessage: {
            state: boolean;
        };
        draftMode: {
            state: boolean;
        };
        draftWifiSSID: {
            state: boolean;
        };
        draftWifiPassword: {
            state: boolean;
        };
        draftWifiPasswordDirty: {
            state: boolean;
        };
        draftApSSID: {
            state: boolean;
        };
        draftApHasPassword: {
            state: boolean;
        };
        draftApPassword: {
            state: boolean;
        };
        draftApPasswordDirty: {
            state: boolean;
        };
        fieldErrors: {
            state: boolean;
        };
        scanning: {
            state: boolean;
        };
        scanResults: {
            state: boolean;
        };
        scanError: {
            state: boolean;
        };
    };
    static styles: import("lit").CSSResult;
    /** Prefix for API requests. Empty string means same origin. */
    baseUrl: string;
    settings: NetworkSettings | null;
    loading: boolean;
    submitting: boolean;
    errorMessage: string;
    successMessage: string;
    draftMode: Mode;
    draftWifiSSID: string;
    draftWifiPassword: string;
    draftWifiPasswordDirty: boolean;
    draftApSSID: string;
    draftApHasPassword: boolean;
    draftApPassword: string;
    draftApPasswordDirty: boolean;
    fieldErrors: FieldErrors;
    scanning: boolean;
    scanResults: WifiNetwork[];
    scanError: string;
    private client?;
    private clientBaseUrl?;
    /** Monotonic token so late results from an older load() are ignored. */
    private loadToken;
    /** baseUrl the currently displayed settings were loaded from. */
    private settingsBaseUrl;
    /** In-flight scan request; aborted on timeout and on disconnect. */
    private scanController?;
    connectedCallback(): void;
    disconnectedCallback(): void;
    updated(changed: PropertyValues<this>): void;
    render(): TemplateResult;
    private renderForm;
    private renderStation;
    private renderAccessPoint;
    private renderScan;
    private renderNetwork;
    private renderFieldError;
    /**
     * Danger-styled notice shown before Save when the user explicitly emptied a
     * password field that has a stored counterpart: the patch will send `""`,
     * which the server interprets as "clear" (network_api.cpp:203-214).
     */
    private renderPasswordClearWarning;
    private get dirty();
    private ensureClient;
    private load;
    /** Resets the draft from server state. Passwords are intentionally never populated. */
    private applyServerSettings;
    private validate;
    /** Only changed fields are sent; omitted password keys keep the stored value. */
    private buildPatch;
    private handleSave;
    private handleScan;
    private emitError;
    private setMode;
    private handleWifiSSIDInput;
    private handleWifiPasswordInput;
    private handleApSSIDInput;
    private handleApPasswordInput;
    private handleApHasPasswordChange;
    private handlePickSsid;
    private handleSubmit;
    private handleRetry;
}
export {};
