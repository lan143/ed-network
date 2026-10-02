import { LitElement } from 'lit';
import type { TemplateResult } from 'lit';
import './network-status';
import './network-settings';
type TabId = 'status' | 'settings';
export declare class EdnNetworkPage extends LitElement {
    static properties: {
        baseUrl: {
            type: StringConstructor;
            attribute: string;
        };
        pollIntervalMs: {
            type: NumberConstructor;
            attribute: string;
        };
        activeTab: {
            state: boolean;
        };
    };
    static styles: import("lit").CSSResult;
    /** Prefix for API requests, passed through to the active child. */
    baseUrl: string;
    /** Auto-refresh period in ms, passed through to the status child. */
    pollIntervalMs: number;
    /** Mount-on-activate: only the active tab's element is in the DOM. */
    activeTab: TabId;
    render(): TemplateResult;
    private renderActive;
    private selectTab;
}
export {};
