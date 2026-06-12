import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { PreferencesTools } from './preferences-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class PreferencesCoreTools implements ToolExecutor {
    private prefs = new PreferencesTools();

    private actions: ToolActionMap = {
        manage: {
            open: { executor: this.prefs, method: 'open_preferences_settings' },
            query: { executor: this.prefs, method: 'query_preferences_config' },
            set: { executor: this.prefs, method: 'set_preferences_config' },
            reset: { executor: this.prefs, method: 'reset_preferences' }
        },
        global: {
            get_all: { executor: this.prefs, method: 'get_all_preferences' },
            export: { executor: this.prefs, method: 'export_preferences' }
        }
    };

    getTools(): ToolDefinition[] {
        return [
            { name: 'manage', description: 'Preferences management', inputSchema: buildActionSchema(this.actions.manage, 'Preferences parameters') },
            { name: 'global', description: 'Read and export global preferences', inputSchema: buildActionSchema(this.actions.global, 'Global preferences parameters') }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
