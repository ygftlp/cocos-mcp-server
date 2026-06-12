"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceImageCoreTools = void 0;
const reference_image_tools_1 = require("./reference-image-tools");
const core_action_utils_1 = require("./core-action-utils");
class ReferenceImageCoreTools {
    constructor() {
        this.reference = new reference_image_tools_1.ReferenceImageTools();
        this.actions = {
            manage: {
                add: { executor: this.reference, method: 'add_reference_image' },
                remove: { executor: this.reference, method: 'remove_reference_image' },
                list: { executor: this.reference, method: 'list_reference_images' },
                clear_all: { executor: this.reference, method: 'clear_all_reference_images' }
            },
            view: {
                switch: { executor: this.reference, method: 'switch_reference_image' },
                set_data: { executor: this.reference, method: 'set_reference_image_data' },
                config: { executor: this.reference, method: 'query_reference_image_config' },
                current: { executor: this.reference, method: 'query_current_reference_image' },
                refresh: { executor: this.reference, method: 'refresh_reference_image' },
                set_position: { executor: this.reference, method: 'set_reference_image_position' },
                set_scale: { executor: this.reference, method: 'set_reference_image_scale' },
                set_opacity: { executor: this.reference, method: 'set_reference_image_opacity' }
            }
        };
    }
    getTools() {
        return [
            {
                name: 'manage',
                description: 'Reference image management',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.manage), 'Parameters for the selected action')
            },
            {
                name: 'view',
                description: 'Reference image view operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.view), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
}
exports.ReferenceImageCoreTools = ReferenceImageCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1yZWZlcmVuY2UtaW1hZ2UtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvY29yZS1yZWZlcmVuY2UtaW1hZ2UtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsbUVBQThEO0FBQzlELDJEQUFzRjtBQUV0RixNQUFhLHVCQUF1QjtJQUFwQztRQUNZLGNBQVMsR0FBRyxJQUFJLDJDQUFtQixFQUFFLENBQUM7UUFFdEMsWUFBTyxHQUFrQjtZQUM3QixNQUFNLEVBQUU7Z0JBQ0osR0FBRyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLHFCQUFxQixFQUFFO2dCQUNoRSxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsd0JBQXdCLEVBQUU7Z0JBQ3RFLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSx1QkFBdUIsRUFBRTtnQkFDbkUsU0FBUyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLDRCQUE0QixFQUFFO2FBQ2hGO1lBQ0QsSUFBSSxFQUFFO2dCQUNGLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSx3QkFBd0IsRUFBRTtnQkFDdEUsUUFBUSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLDBCQUEwQixFQUFFO2dCQUMxRSxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsOEJBQThCLEVBQUU7Z0JBQzVFLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSwrQkFBK0IsRUFBRTtnQkFDOUUsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLHlCQUF5QixFQUFFO2dCQUN4RSxZQUFZLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsOEJBQThCLEVBQUU7Z0JBQ2xGLFNBQVMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSwyQkFBMkIsRUFBRTtnQkFDNUUsV0FBVyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLDZCQUE2QixFQUFFO2FBQ25GO1NBQ0osQ0FBQztJQW9CTixDQUFDO0lBbEJHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLDRCQUE0QjtnQkFDekMsV0FBVyxFQUFFLElBQUEscUNBQWlCLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLG9DQUFvQyxDQUFDO2FBQ3pHO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLE1BQU07Z0JBQ1osV0FBVyxFQUFFLGlDQUFpQztnQkFDOUMsV0FBVyxFQUFFLElBQUEscUNBQWlCLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLG9DQUFvQyxDQUFDO2FBQ3ZHO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQWdCLEVBQUUsSUFBUztRQUNyQyxPQUFPLElBQUEsaUNBQWEsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2RCxDQUFDO0NBQ0o7QUF4Q0QsMERBd0NDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gdjEuNSBjb3JlIHJlZmVyZW5jZSBpbWFnZSB0b29sczogYWN0aW9uLWJhc2VkIGZhY2FkZS5cbmltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sRXhlY3V0b3IsIFRvb2xSZXNwb25zZSB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IFJlZmVyZW5jZUltYWdlVG9vbHMgfSBmcm9tICcuL3JlZmVyZW5jZS1pbWFnZS10b29scyc7XG5pbXBvcnQgeyBidWlsZEFjdGlvblNjaGVtYSwgZXhlY3V0ZUFjdGlvbiwgVG9vbEFjdGlvbk1hcCB9IGZyb20gJy4vY29yZS1hY3Rpb24tdXRpbHMnO1xuXG5leHBvcnQgY2xhc3MgUmVmZXJlbmNlSW1hZ2VDb3JlVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIHByaXZhdGUgcmVmZXJlbmNlID0gbmV3IFJlZmVyZW5jZUltYWdlVG9vbHMoKTtcblxuICAgIHByaXZhdGUgYWN0aW9uczogVG9vbEFjdGlvbk1hcCA9IHtcbiAgICAgICAgbWFuYWdlOiB7XG4gICAgICAgICAgICBhZGQ6IHsgZXhlY3V0b3I6IHRoaXMucmVmZXJlbmNlLCBtZXRob2Q6ICdhZGRfcmVmZXJlbmNlX2ltYWdlJyB9LFxuICAgICAgICAgICAgcmVtb3ZlOiB7IGV4ZWN1dG9yOiB0aGlzLnJlZmVyZW5jZSwgbWV0aG9kOiAncmVtb3ZlX3JlZmVyZW5jZV9pbWFnZScgfSxcbiAgICAgICAgICAgIGxpc3Q6IHsgZXhlY3V0b3I6IHRoaXMucmVmZXJlbmNlLCBtZXRob2Q6ICdsaXN0X3JlZmVyZW5jZV9pbWFnZXMnIH0sXG4gICAgICAgICAgICBjbGVhcl9hbGw6IHsgZXhlY3V0b3I6IHRoaXMucmVmZXJlbmNlLCBtZXRob2Q6ICdjbGVhcl9hbGxfcmVmZXJlbmNlX2ltYWdlcycgfVxuICAgICAgICB9LFxuICAgICAgICB2aWV3OiB7XG4gICAgICAgICAgICBzd2l0Y2g6IHsgZXhlY3V0b3I6IHRoaXMucmVmZXJlbmNlLCBtZXRob2Q6ICdzd2l0Y2hfcmVmZXJlbmNlX2ltYWdlJyB9LFxuICAgICAgICAgICAgc2V0X2RhdGE6IHsgZXhlY3V0b3I6IHRoaXMucmVmZXJlbmNlLCBtZXRob2Q6ICdzZXRfcmVmZXJlbmNlX2ltYWdlX2RhdGEnIH0sXG4gICAgICAgICAgICBjb25maWc6IHsgZXhlY3V0b3I6IHRoaXMucmVmZXJlbmNlLCBtZXRob2Q6ICdxdWVyeV9yZWZlcmVuY2VfaW1hZ2VfY29uZmlnJyB9LFxuICAgICAgICAgICAgY3VycmVudDogeyBleGVjdXRvcjogdGhpcy5yZWZlcmVuY2UsIG1ldGhvZDogJ3F1ZXJ5X2N1cnJlbnRfcmVmZXJlbmNlX2ltYWdlJyB9LFxuICAgICAgICAgICAgcmVmcmVzaDogeyBleGVjdXRvcjogdGhpcy5yZWZlcmVuY2UsIG1ldGhvZDogJ3JlZnJlc2hfcmVmZXJlbmNlX2ltYWdlJyB9LFxuICAgICAgICAgICAgc2V0X3Bvc2l0aW9uOiB7IGV4ZWN1dG9yOiB0aGlzLnJlZmVyZW5jZSwgbWV0aG9kOiAnc2V0X3JlZmVyZW5jZV9pbWFnZV9wb3NpdGlvbicgfSxcbiAgICAgICAgICAgIHNldF9zY2FsZTogeyBleGVjdXRvcjogdGhpcy5yZWZlcmVuY2UsIG1ldGhvZDogJ3NldF9yZWZlcmVuY2VfaW1hZ2Vfc2NhbGUnIH0sXG4gICAgICAgICAgICBzZXRfb3BhY2l0eTogeyBleGVjdXRvcjogdGhpcy5yZWZlcmVuY2UsIG1ldGhvZDogJ3NldF9yZWZlcmVuY2VfaW1hZ2Vfb3BhY2l0eScgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdtYW5hZ2UnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUmVmZXJlbmNlIGltYWdlIG1hbmFnZW1lbnQnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMubWFuYWdlKSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndmlldycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSZWZlcmVuY2UgaW1hZ2UgdmlldyBvcGVyYXRpb25zJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLnZpZXcpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gZXhlY3V0ZUFjdGlvbih0b29sTmFtZSwgYXJncywgdGhpcy5hY3Rpb25zKTtcbiAgICB9XG59XG4iXX0=