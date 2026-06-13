export type UIEventMode = 'add' | 'replace' | 'clear';

export interface UIEventHandlerInput {
    targetNodeUuid: string;
    component: string;
    handler: string;
    customEventData?: string;
}

/** Version-specific bridge for UI event serialization and scene snapshots. */
export interface UIAdapter {
    configureEvent(
        nodeUuid: string,
        componentType: string,
        eventProperty: string,
        handlers: UIEventHandlerInput[],
        mode: UIEventMode
    ): Promise<any>;
    listEvents(nodeUuid: string, componentType: string, eventProperty?: string | null): Promise<any>;
}
