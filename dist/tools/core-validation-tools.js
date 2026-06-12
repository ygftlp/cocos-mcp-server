"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationCoreTools = void 0;
const validation_tools_1 = require("./validation-tools");
const debug_tools_1 = require("./debug-tools");
const asset_advanced_tools_1 = require("./asset-advanced-tools");
const core_action_utils_1 = require("./core-action-utils");
class ValidationCoreTools {
    constructor() {
        this.validation = new validation_tools_1.ValidationTools();
        this.debug = new debug_tools_1.DebugTools();
        this.assetAdvanced = new asset_advanced_tools_1.AssetAdvancedTools();
        this.actions = {
            scene: {
                validate: { executor: this.debug, method: 'validate_scene' }
            },
            asset: {
                validate_references: { executor: this.assetAdvanced, method: 'validate_asset_references' }
            },
            json: {
                validate_params: { executor: this.validation, method: 'validate_json_params' },
                safe_string: { executor: this.validation, method: 'safe_string_value' }
            },
            request: {
                format_mcp: { executor: this.validation, method: 'format_mcp_request' }
            }
        };
    }
    getTools() {
        return [
            {
                name: 'scene',
                description: 'Scene validation',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.scene), 'Parameters for the selected action')
            },
            {
                name: 'asset',
                description: 'Asset validation',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.asset), 'Parameters for the selected action')
            },
            {
                name: 'json',
                description: 'JSON validation and safety helpers',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.json), 'Parameters for the selected action')
            },
            {
                name: 'request',
                description: 'MCP request formatting helpers',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.request), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
}
exports.ValidationCoreTools = ValidationCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS12YWxpZGF0aW9uLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL2NvcmUtdmFsaWRhdGlvbi10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSx5REFBcUQ7QUFDckQsK0NBQTJDO0FBQzNDLGlFQUE0RDtBQUM1RCwyREFBc0Y7QUFFdEYsTUFBYSxtQkFBbUI7SUFBaEM7UUFDWSxlQUFVLEdBQUcsSUFBSSxrQ0FBZSxFQUFFLENBQUM7UUFDbkMsVUFBSyxHQUFHLElBQUksd0JBQVUsRUFBRSxDQUFDO1FBQ3pCLGtCQUFhLEdBQUcsSUFBSSx5Q0FBa0IsRUFBRSxDQUFDO1FBRXpDLFlBQU8sR0FBa0I7WUFDN0IsS0FBSyxFQUFFO2dCQUNILFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRTthQUMvRDtZQUNELEtBQUssRUFBRTtnQkFDSCxtQkFBbUIsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLE1BQU0sRUFBRSwyQkFBMkIsRUFBRTthQUM3RjtZQUNELElBQUksRUFBRTtnQkFDRixlQUFlLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsc0JBQXNCLEVBQUU7Z0JBQzlFLFdBQVcsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxtQkFBbUIsRUFBRTthQUMxRTtZQUNELE9BQU8sRUFBRTtnQkFDTCxVQUFVLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsb0JBQW9CLEVBQUU7YUFDMUU7U0FDSixDQUFDO0lBOEJOLENBQUM7SUE1QkcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsT0FBTztnQkFDYixXQUFXLEVBQUUsa0JBQWtCO2dCQUMvQixXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDeEc7WUFDRDtnQkFDSSxJQUFJLEVBQUUsT0FBTztnQkFDYixXQUFXLEVBQUUsa0JBQWtCO2dCQUMvQixXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDeEc7WUFDRDtnQkFDSSxJQUFJLEVBQUUsTUFBTTtnQkFDWixXQUFXLEVBQUUsb0NBQW9DO2dCQUNqRCxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDdkc7WUFDRDtnQkFDSSxJQUFJLEVBQUUsU0FBUztnQkFDZixXQUFXLEVBQUUsZ0NBQWdDO2dCQUM3QyxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDMUc7U0FDSixDQUFDO0lBQ04sQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBZ0IsRUFBRSxJQUFTO1FBQ3JDLE9BQU8sSUFBQSxpQ0FBYSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7Q0FDSjtBQWpERCxrREFpREMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB2MS41IGNvcmUgdmFsaWRhdGlvbiB0b29sczogYWN0aW9uLWJhc2VkIGZhY2FkZS5cbmltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sRXhlY3V0b3IsIFRvb2xSZXNwb25zZSB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IFZhbGlkYXRpb25Ub29scyB9IGZyb20gJy4vdmFsaWRhdGlvbi10b29scyc7XG5pbXBvcnQgeyBEZWJ1Z1Rvb2xzIH0gZnJvbSAnLi9kZWJ1Zy10b29scyc7XG5pbXBvcnQgeyBBc3NldEFkdmFuY2VkVG9vbHMgfSBmcm9tICcuL2Fzc2V0LWFkdmFuY2VkLXRvb2xzJztcbmltcG9ydCB7IGJ1aWxkQWN0aW9uU2NoZW1hLCBleGVjdXRlQWN0aW9uLCBUb29sQWN0aW9uTWFwIH0gZnJvbSAnLi9jb3JlLWFjdGlvbi11dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uQ29yZVRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcbiAgICBwcml2YXRlIHZhbGlkYXRpb24gPSBuZXcgVmFsaWRhdGlvblRvb2xzKCk7XG4gICAgcHJpdmF0ZSBkZWJ1ZyA9IG5ldyBEZWJ1Z1Rvb2xzKCk7XG4gICAgcHJpdmF0ZSBhc3NldEFkdmFuY2VkID0gbmV3IEFzc2V0QWR2YW5jZWRUb29scygpO1xuXG4gICAgcHJpdmF0ZSBhY3Rpb25zOiBUb29sQWN0aW9uTWFwID0ge1xuICAgICAgICBzY2VuZToge1xuICAgICAgICAgICAgdmFsaWRhdGU6IHsgZXhlY3V0b3I6IHRoaXMuZGVidWcsIG1ldGhvZDogJ3ZhbGlkYXRlX3NjZW5lJyB9XG4gICAgICAgIH0sXG4gICAgICAgIGFzc2V0OiB7XG4gICAgICAgICAgICB2YWxpZGF0ZV9yZWZlcmVuY2VzOiB7IGV4ZWN1dG9yOiB0aGlzLmFzc2V0QWR2YW5jZWQsIG1ldGhvZDogJ3ZhbGlkYXRlX2Fzc2V0X3JlZmVyZW5jZXMnIH1cbiAgICAgICAgfSxcbiAgICAgICAganNvbjoge1xuICAgICAgICAgICAgdmFsaWRhdGVfcGFyYW1zOiB7IGV4ZWN1dG9yOiB0aGlzLnZhbGlkYXRpb24sIG1ldGhvZDogJ3ZhbGlkYXRlX2pzb25fcGFyYW1zJyB9LFxuICAgICAgICAgICAgc2FmZV9zdHJpbmc6IHsgZXhlY3V0b3I6IHRoaXMudmFsaWRhdGlvbiwgbWV0aG9kOiAnc2FmZV9zdHJpbmdfdmFsdWUnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWVzdDoge1xuICAgICAgICAgICAgZm9ybWF0X21jcDogeyBleGVjdXRvcjogdGhpcy52YWxpZGF0aW9uLCBtZXRob2Q6ICdmb3JtYXRfbWNwX3JlcXVlc3QnIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnc2NlbmUnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2NlbmUgdmFsaWRhdGlvbicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5zY2VuZSksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2Fzc2V0JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fzc2V0IHZhbGlkYXRpb24nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMuYXNzZXQpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0pTT04gdmFsaWRhdGlvbiBhbmQgc2FmZXR5IGhlbHBlcnMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMuanNvbiksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3JlcXVlc3QnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTUNQIHJlcXVlc3QgZm9ybWF0dGluZyBoZWxwZXJzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLnJlcXVlc3QpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gZXhlY3V0ZUFjdGlvbih0b29sTmFtZSwgYXJncywgdGhpcy5hY3Rpb25zKTtcbiAgICB9XG59XG4iXX0=