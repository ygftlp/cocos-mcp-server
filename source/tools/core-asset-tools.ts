// v1.5 core asset tools: action-based facade over legacy executors.
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { ProjectTools } from './project-tools';
import { AssetAdvancedTools } from './asset-advanced-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class AssetCoreTools implements ToolExecutor {
    private project = new ProjectTools();
    private advanced = new AssetAdvancedTools();

    private actions: ToolActionMap = {
        manage: {
            import: { executor: this.project, method: 'import_asset' },
            create: { executor: this.project, method: 'create_asset' },
            delete: { executor: this.project, method: 'delete_asset' },
            save: { executor: this.project, method: 'save_asset' },
            copy: { executor: this.project, method: 'copy_asset' },
            move: { executor: this.project, method: 'move_asset' },
            reimport: { executor: this.project, method: 'reimport_asset' }
        },
        analyze: {
            validate_references: { executor: this.advanced, method: 'validate_asset_references' },
            get_unused: { executor: this.advanced, method: 'get_unused_assets' }
        },
        system: {
            query_db_ready: { executor: this.advanced, method: 'query_asset_db_ready' },
            refresh: { executor: this.project, method: 'refresh_assets' }
        },
        query: {
            list: { executor: this.project, method: 'get_assets' },
            info: { executor: this.project, method: 'get_asset_info' },
            details: { executor: this.project, method: 'get_asset_details' },
            find: { executor: this.project, method: 'find_asset_by_name' },
            uuid: { executor: this.project, method: 'query_asset_uuid' },
            url: { executor: this.project, method: 'query_asset_url' },
            path: { executor: this.project, method: 'query_asset_path' }
        },
        operations: {
            batch_import: { executor: this.advanced, method: 'batch_import_assets' },
            batch_delete: { executor: this.advanced, method: 'batch_delete_assets' },
            open_external: { executor: this.advanced, method: 'open_asset_external' }
        },
        dependency: {
            get_dependencies: { executor: this.advanced, method: 'get_asset_dependencies' }
        },
        manifest: {
            export_manifest: { executor: this.advanced, method: 'export_asset_manifest' },
            generate_url: { executor: this.advanced, method: 'generate_available_url' },
            save_meta: { executor: this.advanced, method: 'save_asset_meta' }
        },
        compress: {
            compress_textures: { executor: this.advanced, method: 'compress_textures' }
        }
    };

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'manage',
                description: 'Asset create/import/delete/copy/move/save',
                inputSchema: buildActionSchema(Object.keys(this.actions.manage), 'Parameters for the selected action')
            },
            {
                name: 'analyze',
                description: 'Asset analysis and validation',
                inputSchema: buildActionSchema(Object.keys(this.actions.analyze), 'Parameters for the selected action')
            },
            {
                name: 'system',
                description: 'Asset DB system operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.system), 'Parameters for the selected action')
            },
            {
                name: 'query',
                description: 'Asset queries and lookups',
                inputSchema: buildActionSchema(Object.keys(this.actions.query), 'Parameters for the selected action')
            },
            {
                name: 'operations',
                description: 'Batch asset operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.operations), 'Parameters for the selected action')
            },
            {
                name: 'dependency',
                description: 'Asset dependency operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.dependency), 'Parameters for the selected action')
            },
            {
                name: 'manifest',
                description: 'Asset manifest and metadata operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.manifest), 'Parameters for the selected action')
            },
            {
                name: 'compress',
                description: 'Asset compression operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.compress), 'Parameters for the selected action')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }

    public clearCache(): void {
        if (typeof (this.project as any).clearCache === 'function') {
            (this.project as any).clearCache();
        }
    }
}
