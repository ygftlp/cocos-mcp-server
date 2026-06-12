// v1.5 core reference image tools: action-based facade.
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { ReferenceImageTools } from './reference-image-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class ReferenceImageCoreTools implements ToolExecutor {
    private reference = new ReferenceImageTools();

    private actions: ToolActionMap = {
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

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'manage',
                description: 'Reference image management',
                inputSchema: buildActionSchema(Object.keys(this.actions.manage), 'Parameters for the selected action')
            },
            {
                name: 'view',
                description: 'Reference image view operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.view), 'Parameters for the selected action')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
