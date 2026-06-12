// v1.5 core preferences tools: action-based facade.
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
            export: { executor: this.prefs, method: 'export_preferences' },
            import: { executor: this.prefs, method: 'import_preferences' }
        }
    };

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'manage',
                description: 'Preferences management',
                inputSchema: buildActionSchema(Object.keys(this.actions.manage), 'Parameters for the selected action')
            },
            {
                name: 'global',
                description: 'Global preferences operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.global), 'Parameters for the selected action')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
