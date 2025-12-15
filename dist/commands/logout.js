"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutCommand = logoutCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const config_1 = require("../utils/config");
async function logoutCommand() {
    const spinner = (0, ora_1.default)('Logging out...').start();
    try {
        await (0, config_1.logout)();
        await (0, config_1.saveConfig)({
            apiKey: undefined,
            userId: undefined,
            email: undefined,
            name: undefined,
            role: undefined,
            isDeveloper: undefined,
            isSeller: undefined,
            isAdmin: undefined,
            sessionToken: undefined,
            refreshToken: undefined,
            expiresAt: undefined
        });
        spinner.succeed(chalk_1.default.green('✅ Logged out successfully!'));
        console.log(chalk_1.default.cyan('\n🔑 You have been logged out.'));
        console.log(chalk_1.default.yellow('💡 To login again: mz login\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Logout failed'));
        console.error(chalk_1.default.red(`  Error: ${error.message}`));
    }
}
//# sourceMappingURL=logout.js.map