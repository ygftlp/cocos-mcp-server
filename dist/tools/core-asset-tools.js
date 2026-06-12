"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetCoreTools = void 0;
const project_tools_1 = require("./project-tools");
const asset_advanced_tools_1 = require("./asset-advanced-tools");
const core_action_utils_1 = require("./core-action-utils");
class AssetCoreTools {
    constructor() {
        this.project = new project_tools_1.ProjectTools();
        this.advanced = new asset_advanced_tools_1.AssetAdvancedTools();
        this.actions = {
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
    }
    getTools() {
        return [
            {
                name: 'manage',
                description: 'Asset create/import/delete/copy/move/save',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.manage), 'Parameters for the selected action')
            },
            {
                name: 'analyze',
                description: 'Asset analysis and validation',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.analyze), 'Parameters for the selected action')
            },
            {
                name: 'system',
                description: 'Asset DB system operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.system), 'Parameters for the selected action')
            },
            {
                name: 'query',
                description: 'Asset queries and lookups',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.query), 'Parameters for the selected action')
            },
            {
                name: 'operations',
                description: 'Batch asset operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.operations), 'Parameters for the selected action')
            },
            {
                name: 'dependency',
                description: 'Asset dependency operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.dependency), 'Parameters for the selected action')
            },
            {
                name: 'manifest',
                description: 'Asset manifest and metadata operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.manifest), 'Parameters for the selected action')
            },
            {
                name: 'compress',
                description: 'Asset compression operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.compress), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
    clearCache() {
        if (typeof this.project.clearCache === 'function') {
            this.project.clearCache();
        }
    }
}
exports.AssetCoreTools = AssetCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1hc3NldC10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9jb3JlLWFzc2V0LXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLG1EQUErQztBQUMvQyxpRUFBNEQ7QUFDNUQsMkRBQXNGO0FBRXRGLE1BQWEsY0FBYztJQUEzQjtRQUNZLFlBQU8sR0FBRyxJQUFJLDRCQUFZLEVBQUUsQ0FBQztRQUM3QixhQUFRLEdBQUcsSUFBSSx5Q0FBa0IsRUFBRSxDQUFDO1FBRXBDLFlBQU8sR0FBa0I7WUFDN0IsTUFBTSxFQUFFO2dCQUNKLE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUU7Z0JBQzFELE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUU7Z0JBQzFELE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUU7Z0JBQzFELElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUU7Z0JBQ3RELElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUU7Z0JBQ3RELElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUU7Z0JBQ3RELFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRTthQUNqRTtZQUNELE9BQU8sRUFBRTtnQkFDTCxtQkFBbUIsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSwyQkFBMkIs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LENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUMzRztTQUNKLENBQUM7SUFDTixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFnQixFQUFFLElBQVM7UUFDckMsT0FBTyxJQUFBLGlDQUFhLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVNLFVBQVU7UUFDYixJQUFJLE9BQVEsSUFBSSxDQUFDLE9BQWUsQ0FBQyxVQUFVLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDeEQsSUFBSSxDQUFDLE9BQWUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN2QyxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBdkdELHdDQXVHQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHYxLjUgY29yZSBhc3NldCB0b29sczogYWN0aW9uLWJhc2VkIGZhY2FkZSBvdmVyIGxlZ2FjeSBleGVjdXRvcnMuXG5pbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbEV4ZWN1dG9yLCBUb29sUmVzcG9uc2UgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBQcm9qZWN0VG9vbHMgfSBmcm9tICcuL3Byb2plY3QtdG9vbHMnO1xuaW1wb3J0IHsgQXNzZXRBZHZhbmNlZFRvb2xzIH0gZnJvbSAnLi9hc3NldC1hZHZhbmNlZC10b29scyc7XG5pbXBvcnQgeyBidWlsZEFjdGlvblNjaGVtYSwgZXhlY3V0ZUFjdGlvbiwgVG9vbEFjdGlvbk1hcCB9IGZyb20gJy4vY29yZS1hY3Rpb24tdXRpbHMnO1xuXG5leHBvcnQgY2xhc3MgQXNzZXRDb3JlVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIHByaXZhdGUgcHJvamVjdCA9IG5ldyBQcm9qZWN0VG9vbHMoKTtcbiAgICBwcml2YXRlIGFkdmFuY2VkID0gbmV3IEFzc2V0QWR2YW5jZWRUb29scygpO1xuXG4gICAgcHJpdmF0ZSBhY3Rpb25zOiBUb29sQWN0aW9uTWFwID0ge1xuICAgICAgICBtYW5hZ2U6IHtcbiAgICAgICAgICAgIGltcG9ydDogeyBleGVjdXRvcjogdGhpcy5wcm9qZWN0LCBtZXRob2Q6ICdpbXBvcnRfYXNzZXQnIH0sXG4gICAgICAgICAgICBjcmVhdGU6IHsgZXhlY3V0b3I6IHRoaXMucHJvamVjdCwgbWV0aG9kOiAnY3JlYXRlX2Fzc2V0JyB9LFxuICAgICAgICAgICAgZGVsZXRlOiB7IGV4ZWN1dG9yOiB0aGlzLnByb2plY3QsIG1ldGhvZDogJ2RlbGV0ZV9hc3NldCcgfSxcbiAgICAgICAgICAgIHNhdmU6IHsgZXhlY3V0b3I6IHRoaXMucHJvamVjdCwgbWV0aG9kOiAnc2F2ZV9hc3NldCcgfSxcbiAgICAgICAgICAgIGNvcHk6IHsgZXhlY3V0b3I6IHRoaXMucHJvamVjdCwgbWV0aG9kOiAnY29weV9hc3NldCcgfSxcbiAgICAgICAgICAgIG1vdmU6IHsgZXhlY3V0b3I6IHRoaXMucHJvamVjdCwgbWV0aG9kOiAnbW92ZV9hc3NldCcgfSxcbiAgICAgICAgICAgIHJlaW1wb3J0OiB7IGV4ZWN1dG9yOiB0aGlzLnByb2plY3QsIG1ldGhvZDogJ3JlaW1wb3J0X2Fzc2V0JyB9XG4gICAgICAgIH0sXG4gICAgICAgIGFuYWx5emU6IHtcbiAgICAgICAgICAgIHZhbGlkYXRlX3JlZmVyZW5jZXM6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ3ZhbGlkYXRlX2Fzc2V0X3JlZmVyZW5jZXMnIH0sXG4gICAgICAgICAgICBnZXRfdW51c2VkOiB7IGV4ZWN1dG9yOiB0aGlzLmFkdmFuY2VkLCBtZXRob2Q6ICdnZXRfdW51c2VkX2Fzc2V0cycgfVxuICAgICAgICB9LFxuICAgICAgICBzeXN0ZW06IHtcbiAgICAgICAgICAgIHF1ZXJ5X2RiX3JlYWR5OiB7IGV4ZWN1dG9yOiB0aGlzLmFkdmFuY2VkLCBtZXRob2Q6ICdxdWVyeV9hc3NldF9kYl9yZWFkeScgfSxcbiAgICAgICAgICAgIHJlZnJlc2g6IHsgZXhlY3V0b3I6IHRoaXMucHJvamVjdCwgbWV0aG9kOiAncmVmcmVzaF9hc3NldHMnIH1cbiAgICAgICAgfSxcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgIGxpc3Q6IHsgZXhlY3V0b3I6IHRoaXMucHJvamVjdCwgbWV0aG9kOiAnZ2V0X2Fzc2V0cycgfSxcbiAgICAgICAgICAgIGluZm86IHsgZXhlY3V0b3I6IHRoaXMucHJvamVjdCwgbWV0aG9kOiAnZ2V0X2Fzc2V0X2luZm8nIH0sXG4gICAgICAgICAgICBkZXRhaWxzOiB7IGV4ZWN1dG9yOiB0aGlzLnByb2plY3QsIG1ldGhvZDogJ2dldF9hc3NldF9kZXRhaWxzJyB9LFxuICAgICAgICAgICAgZmluZDogeyBleGVjdXRvcjogdGhpcy5wcm9qZWN0LCBtZXRob2Q6ICdmaW5kX2Fzc2V0X2J5X25hbWUnIH0sXG4gICAgICAgICAgICB1dWlkOiB7IGV4ZWN1dG9yOiB0aGlzLnByb2plY3QsIG1ldGhvZDogJ3F1ZXJ5X2Fzc2V0X3V1aWQnIH0sXG4gICAgICAgICAgICB1cmw6IHsgZXhlY3V0b3I6IHRoaXMucHJvamVjdCwgbWV0aG9kOiAncXVlcnlfYXNzZXRfdXJsJyB9LFxuICAgICAgICAgICAgcGF0aDogeyBleGVjdXRvcjogdGhpcy5wcm9qZWN0LCBtZXRob2Q6ICdxdWVyeV9hc3NldF9wYXRoJyB9XG4gICAgICAgIH0sXG4gICAgICAgIG9wZXJhdGlvbnM6IHtcbiAgICAgICAgICAgIGJhdGNoX2ltcG9ydDogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAnYmF0Y2hfaW1wb3J0X2Fzc2V0cycgfSxcbiAgICAgICAgICAgIGJhdGNoX2RlbGV0ZTogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAnYmF0Y2hfZGVsZXRlX2Fzc2V0cycgfSxcbiAgICAgICAgICAgIG9wZW5fZXh0ZXJuYWw6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ29wZW5fYXNzZXRfZXh0ZXJuYWwnIH1cbiAgICAgICAgfSxcbiAgICAgICAgZGVwZW5kZW5jeToge1xuICAgICAgICAgICAgZ2V0X2RlcGVuZGVuY2llczogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAnZ2V0X2Fzc2V0X2RlcGVuZGVuY2llcycgfVxuICAgICAgICB9LFxuICAgICAgICBtYW5pZmVzdDoge1xuICAgICAgICAgICAgZXhwb3J0X21hbmlmZXN0OiB7IGV4ZWN1dG9yOiB0aGlzLmFkdmFuY2VkLCBtZXRob2Q6ICdleHBvcnRfYXNzZXRfbWFuaWZlc3QnIH0sXG4gICAgICAgICAgICBnZW5lcmF0ZV91cmw6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ2dlbmVyYXRlX2F2YWlsYWJsZV91cmwnIH0sXG4gICAgICAgICAgICBzYXZlX21ldGE6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ3NhdmVfYXNzZXRfbWV0YScgfVxuICAgICAgICB9LFxuICAgICAgICBjb21wcmVzczoge1xuICAgICAgICAgICAgY29tcHJlc3NfdGV4dHVyZXM6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ2NvbXByZXNzX3RleHR1cmVzJyB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ21hbmFnZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBjcmVhdGUvaW1wb3J0L2RlbGV0ZS9jb3B5L21vdmUvc2F2ZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5tYW5hZ2UpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdhbmFseXplJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fzc2V0IGFuYWx5c2lzIGFuZCB2YWxpZGF0aW9uJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLmFuYWx5emUpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdzeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgREIgc3lzdGVtIG9wZXJhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMuc3lzdGVtKSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncXVlcnknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgcXVlcmllcyBhbmQgbG9va3VwcycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5xdWVyeSksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ29wZXJhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQmF0Y2ggYXNzZXQgb3BlcmF0aW9ucycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5vcGVyYXRpb25zKSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZGVwZW5kZW5jeScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBkZXBlbmRlbmN5IG9wZXJhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMuZGVwZW5kZW5jeSksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ21hbmlmZXN0JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fzc2V0IG1hbmlmZXN0IGFuZCBtZXRhZGF0YSBvcGVyYXRpb25zJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLm1hbmlmZXN0KSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnY29tcHJlc3MnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgY29tcHJlc3Npb24gb3BlcmF0aW9ucycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5jb21wcmVzcyksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBleGVjdXRlQWN0aW9uKHRvb2xOYW1lLCBhcmdzLCB0aGlzLmFjdGlvbnMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjbGVhckNhY2hlKCk6IHZvaWQge1xuICAgICAgICBpZiAodHlwZW9mICh0aGlzLnByb2plY3QgYXMgYW55KS5jbGVhckNhY2hlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAodGhpcy5wcm9qZWN0IGFzIGFueSkuY2xlYXJDYWNoZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19