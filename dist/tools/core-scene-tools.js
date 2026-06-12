"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneCoreTools = void 0;
const scene_tools_1 = require("./scene-tools");
const scene_advanced_tools_1 = require("./scene-advanced-tools");
const core_action_utils_1 = require("./core-action-utils");
class SceneCoreTools {
    constructor() {
        this.scene = new scene_tools_1.SceneTools();
        this.advanced = new scene_advanced_tools_1.SceneAdvancedTools();
        this.actions = {
            management: {
                current: { executor: this.scene, method: 'get_current_scene' },
                list: { executor: this.scene, method: 'get_scene_list' },
                open: { executor: this.scene, method: 'open_scene' },
                save: { executor: this.scene, method: 'save_scene' },
                create: { executor: this.scene, method: 'create_scene' },
                save_as: { executor: this.scene, method: 'save_scene_as' },
                close: { executor: this.scene, method: 'close_scene' }
            },
            hierarchy: {
                get: { executor: this.scene, method: 'get_scene_hierarchy' }
            },
            execution_control: {
                execute_component_method: { executor: this.advanced, method: 'execute_component_method' },
                execute_scene_script: { executor: this.advanced, method: 'execute_scene_script' },
                restore_prefab: { executor: this.advanced, method: 'restore_prefab' }
            },
            snapshot: {
                snapshot: { executor: this.advanced, method: 'scene_snapshot' },
                abort: { executor: this.advanced, method: 'scene_snapshot_abort' }
            },
            query: {
                ready: { executor: this.advanced, method: 'query_scene_ready' },
                dirty: { executor: this.advanced, method: 'query_scene_dirty' },
                classes: { executor: this.advanced, method: 'query_scene_classes' },
                components: { executor: this.advanced, method: 'query_scene_components' }
            },
            undo: {
                begin: { executor: this.advanced, method: 'begin_undo_recording' },
                end: { executor: this.advanced, method: 'end_undo_recording' },
                cancel: { executor: this.advanced, method: 'cancel_undo_recording' },
                soft_reload: { executor: this.advanced, method: 'soft_reload_scene' }
            }
        };
    }
    getTools() {
        return [
            {
                name: 'management',
                description: 'Scene management (current/list/open/save/create/close)',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.management), 'Parameters for the selected action')
            },
            {
                name: 'hierarchy',
                description: 'Scene hierarchy access',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.hierarchy), 'Parameters for the selected action')
            },
            {
                name: 'execution_control',
                description: 'Execute scene/component operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.execution_control), 'Parameters for the selected action')
            },
            {
                name: 'snapshot',
                description: 'Scene snapshot operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.snapshot), 'Parameters for the selected action')
            },
            {
                name: 'query',
                description: 'Query scene status and metadata',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.query), 'Parameters for the selected action')
            },
            {
                name: 'undo',
                description: 'Undo/redo recording control',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.undo), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
}
exports.SceneCoreTools = SceneCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1zY2VuZS10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9jb3JlLXNjZW5lLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLCtDQUEyQztBQUMzQyxpRUFBNEQ7QUFDNUQsMkRBQXNGO0FBRXRGLE1BQWEsY0FBYztJQUEzQjtRQUNZLFVBQUssR0FBRyxJQUFJLHdCQUFVLEVBQUUsQ0FBQztRQUN6QixhQUFRLEdBQUcsSUFBSSx5Q0FBa0IsRUFBRSxDQUFDO1FBRXBDLFlBQU8sR0FBa0I7WUFDN0IsVUFBVSxFQUFFO2dCQUNSLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxtQkFBbUIsRUFBRTtnQkFDOUQsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFO2dCQUN4RCxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFO2dCQUNwRCxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFO2dCQUNwRCxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFO2dCQUN4RCxPQUFPLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFO2dCQUMxRCxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFO2FBQ3pEO1lBQ0QsU0FBUyxFQUFFO2dCQUNQLEdBQUcsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxxQkFBcUIs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QUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUN4RztZQUNEO2dCQUNJLElBQUksRUFBRSxNQUFNO2dCQUNaLFdBQVcsRUFBRSw2QkFBNkI7Z0JBQzFDLFdBQVcsRUFBRSxJQUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUN2RztTQUNKLENBQUM7SUFDTixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFnQixFQUFFLElBQVM7UUFDckMsT0FBTyxJQUFBLGlDQUFhLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsQ0FBQztDQUNKO0FBOUVELHdDQThFQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHYxLjUgY29yZSBzY2VuZSB0b29sczogYWN0aW9uLWJhc2VkIGZhY2FkZS5cbmltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sRXhlY3V0b3IsIFRvb2xSZXNwb25zZSB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IFNjZW5lVG9vbHMgfSBmcm9tICcuL3NjZW5lLXRvb2xzJztcbmltcG9ydCB7IFNjZW5lQWR2YW5jZWRUb29scyB9IGZyb20gJy4vc2NlbmUtYWR2YW5jZWQtdG9vbHMnO1xuaW1wb3J0IHsgYnVpbGRBY3Rpb25TY2hlbWEsIGV4ZWN1dGVBY3Rpb24sIFRvb2xBY3Rpb25NYXAgfSBmcm9tICcuL2NvcmUtYWN0aW9uLXV0aWxzJztcblxuZXhwb3J0IGNsYXNzIFNjZW5lQ29yZVRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcbiAgICBwcml2YXRlIHNjZW5lID0gbmV3IFNjZW5lVG9vbHMoKTtcbiAgICBwcml2YXRlIGFkdmFuY2VkID0gbmV3IFNjZW5lQWR2YW5jZWRUb29scygpO1xuXG4gICAgcHJpdmF0ZSBhY3Rpb25zOiBUb29sQWN0aW9uTWFwID0ge1xuICAgICAgICBtYW5hZ2VtZW50OiB7XG4gICAgICAgICAgICBjdXJyZW50OiB7IGV4ZWN1dG9yOiB0aGlzLnNjZW5lLCBtZXRob2Q6ICdnZXRfY3VycmVudF9zY2VuZScgfSxcbiAgICAgICAgICAgIGxpc3Q6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmUsIG1ldGhvZDogJ2dldF9zY2VuZV9saXN0JyB9LFxuICAgICAgICAgICAgb3BlbjogeyBleGVjdXRvcjogdGhpcy5zY2VuZSwgbWV0aG9kOiAnb3Blbl9zY2VuZScgfSxcbiAgICAgICAgICAgIHNhdmU6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmUsIG1ldGhvZDogJ3NhdmVfc2NlbmUnIH0sXG4gICAgICAgICAgICBjcmVhdGU6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmUsIG1ldGhvZDogJ2NyZWF0ZV9zY2VuZScgfSxcbiAgICAgICAgICAgIHNhdmVfYXM6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmUsIG1ldGhvZDogJ3NhdmVfc2NlbmVfYXMnIH0sXG4gICAgICAgICAgICBjbG9zZTogeyBleGVjdXRvcjogdGhpcy5zY2VuZSwgbWV0aG9kOiAnY2xvc2Vfc2NlbmUnIH1cbiAgICAgICAgfSxcbiAgICAgICAgaGllcmFyY2h5OiB7XG4gICAgICAgICAgICBnZXQ6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmUsIG1ldGhvZDogJ2dldF9zY2VuZV9oaWVyYXJjaHknIH1cbiAgICAgICAgfSxcbiAgICAgICAgZXhlY3V0aW9uX2NvbnRyb2w6IHtcbiAgICAgICAgICAgIGV4ZWN1dGVfY29tcG9uZW50X21ldGhvZDogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAnZXhlY3V0ZV9jb21wb25lbnRfbWV0aG9kJyB9LFxuICAgICAgICAgICAgZXhlY3V0ZV9zY2VuZV9zY3JpcHQ6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ2V4ZWN1dGVfc2NlbmVfc2NyaXB0JyB9LFxuICAgICAgICAgICAgcmVzdG9yZV9wcmVmYWI6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ3Jlc3RvcmVfcHJlZmFiJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHNuYXBzaG90OiB7XG4gICAgICAgICAgICBzbmFwc2hvdDogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAnc2NlbmVfc25hcHNob3QnIH0sXG4gICAgICAgICAgICBhYm9ydDogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAnc2NlbmVfc25hcHNob3RfYWJvcnQnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgIHJlYWR5OiB7IGV4ZWN1dG9yOiB0aGlzLmFkdmFuY2VkLCBtZXRob2Q6ICdxdWVyeV9zY2VuZV9yZWFkeScgfSxcbiAgICAgICAgICAgIGRpcnR5OiB7IGV4ZWN1dG9yOiB0aGlzLmFkdmFuY2VkLCBtZXRob2Q6ICdxdWVyeV9zY2VuZV9kaXJ0eScgfSxcbiAgICAgICAgICAgIGNsYXNzZXM6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ3F1ZXJ5X3NjZW5lX2NsYXNzZXMnIH0sXG4gICAgICAgICAgICBjb21wb25lbnRzOiB7IGV4ZWN1dG9yOiB0aGlzLmFkdmFuY2VkLCBtZXRob2Q6ICdxdWVyeV9zY2VuZV9jb21wb25lbnRzJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHVuZG86IHtcbiAgICAgICAgICAgIGJlZ2luOiB7IGV4ZWN1dG9yOiB0aGlzLmFkdmFuY2VkLCBtZXRob2Q6ICdiZWdpbl91bmRvX3JlY29yZGluZycgfSxcbiAgICAgICAgICAgIGVuZDogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAnZW5kX3VuZG9fcmVjb3JkaW5nJyB9LFxuICAgICAgICAgICAgY2FuY2VsOiB7IGV4ZWN1dG9yOiB0aGlzLmFkdmFuY2VkLCBtZXRob2Q6ICdjYW5jZWxfdW5kb19yZWNvcmRpbmcnIH0sXG4gICAgICAgICAgICBzb2Z0X3JlbG9hZDogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAnc29mdF9yZWxvYWRfc2NlbmUnIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnbWFuYWdlbWVudCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTY2VuZSBtYW5hZ2VtZW50IChjdXJyZW50L2xpc3Qvb3Blbi9zYXZlL2NyZWF0ZS9jbG9zZSknLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMubWFuYWdlbWVudCksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2hpZXJhcmNoeScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTY2VuZSBoaWVyYXJjaHkgYWNjZXNzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLmhpZXJhcmNoeSksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2V4ZWN1dGlvbl9jb250cm9sJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0V4ZWN1dGUgc2NlbmUvY29tcG9uZW50IG9wZXJhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMuZXhlY3V0aW9uX2NvbnRyb2wpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzbmFwc2hvdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTY2VuZSBzbmFwc2hvdCBvcGVyYXRpb25zJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLnNuYXBzaG90KSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncXVlcnknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUXVlcnkgc2NlbmUgc3RhdHVzIGFuZCBtZXRhZGF0YScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5xdWVyeSksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3VuZG8nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVW5kby9yZWRvIHJlY29yZGluZyBjb250cm9sJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLnVuZG8pLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gZXhlY3V0ZUFjdGlvbih0b29sTmFtZSwgYXJncywgdGhpcy5hY3Rpb25zKTtcbiAgICB9XG59XG4iXX0=