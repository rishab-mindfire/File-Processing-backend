"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCustomId = generateCustomId;
// Generate a custom id
function generateCustomId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
//# sourceMappingURL=randomId.js.map