"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesCoreTools = void 0;
const preferences_tools_1 = require("./preferences-tools");
const core_action_utils_1 = require("./core-action-utils");
class PreferencesCoreTools {
    constructor() {
        this.prefs = new preferences_tools_1.PreferencesTools();
        this.actions = {
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
    }
    getTools() {
        return [
            {
                name: 'manage',
                description: 'Preferences management',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.manage), 'Parameters for the selected action')
            },
            {
                name: 'global',
                description: 'Global preferences operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.global), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
}
exports.PreferencesCoreTools = PreferencesCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1wcmVmZXJlbmNlcy10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9jb3JlLXByZWZlcmVuY2VzLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLDJEQUF1RDtBQUN2RCwyREFBc0Y7QUFFdEYsTUFBYSxvQkFBb0I7SUFBakM7UUFDWSxVQUFLLEdBQUcsSUFBSSxvQ0FBZ0IsRUFBRSxDQUFDO1FBRS9CLFlBQU8sR0FBa0I7WUFDN0IsTUFBTSxFQUFFO2dCQUNKLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSwyQkFBMkIsRUFBRTtnQkFDbkUsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLDBCQUEwQixFQUFFO2dCQUNuRSxHQUFHLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsd0JBQXdCLEVBQUU7Z0JBQy9ELEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxtQkFBbUIsRUFBRTthQUMvRDtZQUNELE1BQU0sRUFBRTtnQkFDSixPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUscUJBQXFCLEVBQUU7Z0JBQ2hFLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxvQkFBb0IsRUFBRTtnQkFDOUQsTUFBTSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLG9CQUFvQixFQUFFO2FBQ2pFO1NBQ0osQ0FBQztJQW9CTixDQUFDO0lBbEJHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLHdCQUF3QjtnQkFDckMsV0FBVyxFQUFFLElBQUEscUNBQWlCLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLG9DQUFvQyxDQUFDO2FBQ3pHO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLCtCQUErQjtnQkFDNUMsV0FBVyxFQUFFLElBQUEscUNBQWlCLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLG9DQUFvQyxDQUFDO2FBQ3pHO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQWdCLEVBQUUsSUFBUztRQUNyQyxPQUFPLElBQUEsaUNBQWEsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2RCxDQUFDO0NBQ0o7QUFuQ0Qsb0RBbUNDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gdjEuNSBjb3JlIHByZWZlcmVuY2VzIHRvb2xzOiBhY3Rpb24tYmFzZWQgZmFjYWRlLlxuaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xFeGVjdXRvciwgVG9vbFJlc3BvbnNlIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgUHJlZmVyZW5jZXNUb29scyB9IGZyb20gJy4vcHJlZmVyZW5jZXMtdG9vbHMnO1xuaW1wb3J0IHsgYnVpbGRBY3Rpb25TY2hlbWEsIGV4ZWN1dGVBY3Rpb24sIFRvb2xBY3Rpb25NYXAgfSBmcm9tICcuL2NvcmUtYWN0aW9uLXV0aWxzJztcblxuZXhwb3J0IGNsYXNzIFByZWZlcmVuY2VzQ29yZVRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcbiAgICBwcml2YXRlIHByZWZzID0gbmV3IFByZWZlcmVuY2VzVG9vbHMoKTtcblxuICAgIHByaXZhdGUgYWN0aW9uczogVG9vbEFjdGlvbk1hcCA9IHtcbiAgICAgICAgbWFuYWdlOiB7XG4gICAgICAgICAgICBvcGVuOiB7IGV4ZWN1dG9yOiB0aGlzLnByZWZzLCBtZXRob2Q6ICdvcGVuX3ByZWZlcmVuY2VzX3NldHRpbmdzJyB9LFxuICAgICAgICAgICAgcXVlcnk6IHsgZXhlY3V0b3I6IHRoaXMucHJlZnMsIG1ldGhvZDogJ3F1ZXJ5X3ByZWZlcmVuY2VzX2NvbmZpZycgfSxcbiAgICAgICAgICAgIHNldDogeyBleGVjdXRvcjogdGhpcy5wcmVmcywgbWV0aG9kOiAnc2V0X3ByZWZlcmVuY2VzX2NvbmZpZycgfSxcbiAgICAgICAgICAgIHJlc2V0OiB7IGV4ZWN1dG9yOiB0aGlzLnByZWZzLCBtZXRob2Q6ICdyZXNldF9wcmVmZXJlbmNlcycgfVxuICAgICAgICB9LFxuICAgICAgICBnbG9iYWw6IHtcbiAgICAgICAgICAgIGdldF9hbGw6IHsgZXhlY3V0b3I6IHRoaXMucHJlZnMsIG1ldGhvZDogJ2dldF9hbGxfcHJlZmVyZW5jZXMnIH0sXG4gICAgICAgICAgICBleHBvcnQ6IHsgZXhlY3V0b3I6IHRoaXMucHJlZnMsIG1ldGhvZDogJ2V4cG9ydF9wcmVmZXJlbmNlcycgfSxcbiAgICAgICAgICAgIGltcG9ydDogeyBleGVjdXRvcjogdGhpcy5wcmVmcywgbWV0aG9kOiAnaW1wb3J0X3ByZWZlcmVuY2VzJyB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ21hbmFnZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmZXJlbmNlcyBtYW5hZ2VtZW50JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLm1hbmFnZSksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dsb2JhbCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHbG9iYWwgcHJlZmVyZW5jZXMgb3BlcmF0aW9ucycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5nbG9iYWwpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gZXhlY3V0ZUFjdGlvbih0b29sTmFtZSwgYXJncywgdGhpcy5hY3Rpb25zKTtcbiAgICB9XG59XG4iXX0=