import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { ValidationTools } from './validation-tools';
import { DebugTools } from './debug-tools';
import { AssetAdvancedTools } from './asset-advanced-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class ValidationCoreTools implements ToolExecutor {
    private validation = new ValidationTools();
    private debug = new DebugTools();
    private assetAdvanced = new AssetAdvancedTools();

    private actions: ToolActionMap = {
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

    getTools(): ToolDefinition[] {
        return [
            { name: 'scene', description: 'Scene validation', inputSchema: buildActionSchema(this.actions.scene, 'Scene validation parameters') },
            { name: 'asset', description: 'Asset availability validation', inputSchema: buildActionSchema(this.actions.asset, 'Asset validation parameters') },
            { name: 'json', description: 'JSON validation and safety helpers', inputSchema: buildActionSchema(this.actions.json, 'JSON helper parameters') },
            { name: 'request', description: 'MCP request formatting helpers', inputSchema: buildActionSchema(this.actions.request, 'MCP request parameters') }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
