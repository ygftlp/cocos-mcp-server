"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildActionSchema = buildActionSchema;
exports.resolveAction = resolveAction;
exports.resolveParams = resolveParams;
exports.executeAction = executeAction;
function buildActionSchema(actions, paramsDescription) {
    return {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                description: 'Action to perform',
                enum: actions
            },
            params: {
                type: 'object',
                description: paramsDescription,
                default: {}
            }
        },
        required: ['action']
    };
}
function resolveAction(args) {
    if (!args || typeof args !== 'object')
        return null;
    if (typeof args.action === 'string')
        return args.action;
    return null;
}
function resolveParams(args) {
    if (!args || typeof args !== 'object')
        return {};
    if (args.params && typeof args.params === 'object') {
        return args.params;
    }
    const { action } = args, rest = __rest(args, ["action"]);
    return rest;
}
async function executeAction(toolName, args, map) {
    const toolActions = map[toolName];
    if (!toolActions) {
        throw new Error(`Unknown tool: ${toolName}`);
    }
    let action = resolveAction(args);
    if (!action) {
        const available = Object.keys(toolActions);
        if (available.length === 1) {
            action = available[0];
        }
        else {
            throw new Error(`Missing action. Available actions: ${available.join(', ')}`);
        }
    }
    const handler = toolActions[action];
    if (!handler) {
        throw new Error(`Unknown action '${action}'. Available actions: ${Object.keys(toolActions).join(', ')}`);
    }
    const params = resolveParams(args);
    return handler.executor.execute(handler.method, params);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1hY3Rpb24tdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvY29yZS1hY3Rpb24tdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQU1BLDhDQWlCQztBQUVELHNDQUlDO0FBRUQsc0NBT0M7QUFFRCxzQ0F1QkM7QUF6REQsU0FBZ0IsaUJBQWlCLENBQUMsT0FBaUIsRUFBRSxpQkFBeUI7SUFDMUUsT0FBTztRQUNILElBQUksRUFBRSxRQUFRO1FBQ2QsVUFBVSxFQUFFO1lBQ1IsTUFBTSxFQUFFO2dCQUNKLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxtQkFBbUI7Z0JBQ2hDLElBQUksRUFBRSxPQUFPO2FBQ2hCO1lBQ0QsTUFBTSxFQUFFO2dCQUNKLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSxpQkFBaUI7Z0JBQzlCLE9BQU8sRUFBRSxFQUFFO2FBQ2Q7U0FDSjtRQUNELFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQztLQUN2QixDQUFDO0FBQ04sQ0FBQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxJQUFTO0lBQ25DLElBQUksQ0FBQyxJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUTtRQUFFLE9BQU8sSUFBSSxDQUFDO0lBQ25ELElBQUksT0FBTyxJQUFJLENBQUMsTUFBTSxLQUFLLFFBQVE7UUFBRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDeEQsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxJQUFTO0lBQ25DLElBQUksQ0FBQyxJQUFJLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUTtRQUFFLE9BQU8sRUFBRSxDQUFDO0lBQ2pELElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxPQUFPLElBQUksQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDakQsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7SUFDRCxNQUFNLEVBQUUsTUFBTSxLQUFjLElBQUksRUFBYixJQUFJLFVBQUssSUFBSSxFQUExQixVQUFtQixDQUFPLENBQUM7SUFDakMsT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQztBQUVNLEtBQUssVUFBVSxhQUFhLENBQUMsUUFBZ0IsRUFBRSxJQUFTLEVBQUUsR0FBa0I7SUFDL0UsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2xDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELElBQUksTUFBTSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDVixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzNDLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN6QixNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFCLENBQUM7YUFBTSxDQUFDO1lBQ0osTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEYsQ0FBQztJQUNMLENBQUM7SUFFRCxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDcEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ1gsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsTUFBTSx5QkFBeUIsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzdHLENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbkMsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzVELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTaGFyZWQgaGVscGVycyB0byB2YWxpZGF0ZSBhbmQgZGlzcGF0Y2ggYWN0aW9uLWJhc2VkIHRvb2wgY2FsbHMuXG5pbXBvcnQgeyBUb29sRXhlY3V0b3IsIFRvb2xSZXNwb25zZSB9IGZyb20gJy4uL3R5cGVzJztcblxuZXhwb3J0IHR5cGUgQWN0aW9uSGFuZGxlciA9IHsgZXhlY3V0b3I6IFRvb2xFeGVjdXRvcjsgbWV0aG9kOiBzdHJpbmcgfTtcbmV4cG9ydCB0eXBlIFRvb2xBY3Rpb25NYXAgPSBSZWNvcmQ8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBBY3Rpb25IYW5kbGVyPj47XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEFjdGlvblNjaGVtYShhY3Rpb25zOiBzdHJpbmdbXSwgcGFyYW1zRGVzY3JpcHRpb246IHN0cmluZyk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWN0aW9uIHRvIHBlcmZvcm0nLFxuICAgICAgICAgICAgICAgIGVudW06IGFjdGlvbnNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogcGFyYW1zRGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgZGVmYXVsdDoge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnYWN0aW9uJ11cbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUFjdGlvbihhcmdzOiBhbnkpOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoIWFyZ3MgfHwgdHlwZW9mIGFyZ3MgIT09ICdvYmplY3QnKSByZXR1cm4gbnVsbDtcbiAgICBpZiAodHlwZW9mIGFyZ3MuYWN0aW9uID09PSAnc3RyaW5nJykgcmV0dXJuIGFyZ3MuYWN0aW9uO1xuICAgIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVBhcmFtcyhhcmdzOiBhbnkpOiBhbnkge1xuICAgIGlmICghYXJncyB8fCB0eXBlb2YgYXJncyAhPT0gJ29iamVjdCcpIHJldHVybiB7fTtcbiAgICBpZiAoYXJncy5wYXJhbXMgJiYgdHlwZW9mIGFyZ3MucGFyYW1zID09PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gYXJncy5wYXJhbXM7XG4gICAgfVxuICAgIGNvbnN0IHsgYWN0aW9uLCAuLi5yZXN0IH0gPSBhcmdzO1xuICAgIHJldHVybiByZXN0O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhlY3V0ZUFjdGlvbih0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnksIG1hcDogVG9vbEFjdGlvbk1hcCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgY29uc3QgdG9vbEFjdGlvbnMgPSBtYXBbdG9vbE5hbWVdO1xuICAgIGlmICghdG9vbEFjdGlvbnMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHRvb2w6ICR7dG9vbE5hbWV9YCk7XG4gICAgfVxuXG4gICAgbGV0IGFjdGlvbiA9IHJlc29sdmVBY3Rpb24oYXJncyk7XG4gICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgICAgY29uc3QgYXZhaWxhYmxlID0gT2JqZWN0LmtleXModG9vbEFjdGlvbnMpO1xuICAgICAgICBpZiAoYXZhaWxhYmxlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgYWN0aW9uID0gYXZhaWxhYmxlWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nIGFjdGlvbi4gQXZhaWxhYmxlIGFjdGlvbnM6ICR7YXZhaWxhYmxlLmpvaW4oJywgJyl9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBoYW5kbGVyID0gdG9vbEFjdGlvbnNbYWN0aW9uXTtcbiAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGFjdGlvbiAnJHthY3Rpb259Jy4gQXZhaWxhYmxlIGFjdGlvbnM6ICR7T2JqZWN0LmtleXModG9vbEFjdGlvbnMpLmpvaW4oJywgJyl9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGFyYW1zID0gcmVzb2x2ZVBhcmFtcyhhcmdzKTtcbiAgICByZXR1cm4gaGFuZGxlci5leGVjdXRvci5leGVjdXRlKGhhbmRsZXIubWV0aG9kLCBwYXJhbXMpO1xufVxuIl19