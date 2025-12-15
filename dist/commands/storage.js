"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageCommand = storageCommand;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const auth_1 = require("../middleware/auth");
const axios_1 = __importDefault(require("axios"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const form_data_1 = __importDefault(require("form-data"));
async function storageCommand(options) {
    const spinner = (0, ora_1.default)('Processing...').start();
    try {
        const headers = await (0, auth_1.getAuthHeaders)();
        if (options.list) {
            spinner.text = 'Fetching files...';
            const response = await axios_1.default.get(await (0, auth_1.buildApiUrl)('/storage'), { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to fetch files');
            }
            const files = response.data.data.files;
            const storageUsed = response.data.data.user?.storageUsed || 0;
            spinner.succeed(chalk_1.default.green(`✅ Found ${files.length} file(s) - ${Math.round(storageUsed / 1024 / 1024)} MB used`));
            console.log(chalk_1.default.cyan('\n📁 Storage Files\n'));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            if (files.length === 0) {
                console.log(chalk_1.default.yellow('No files found. Upload one with: mz storage --upload <file>'));
                return;
            }
            files.forEach((file, index) => {
                console.log(chalk_1.default.bold(`\n${index + 1}. ${file.originalFilename || file.publicId.split('/').pop()}`));
                console.log(chalk_1.default.gray(`   ID: ${file.id}`));
                console.log(chalk_1.default.gray(`   Size: ${Math.round(file.size)} KB`));
                console.log(chalk_1.default.gray(`   Format: ${file.format.toUpperCase()}`));
                console.log(chalk_1.default.gray(`   Type: ${file.resourceType}`));
                console.log(chalk_1.default.gray(`   Created: ${new Date(file.createdAt).toLocaleString()}`));
                if (file.tags.length > 0) {
                    console.log(chalk_1.default.gray(`   Tags: ${file.tags.join(', ')}`));
                }
                if (file.width && file.height) {
                    console.log(chalk_1.default.gray(`   Dimensions: ${file.width}x${file.height}`));
                }
                console.log(chalk_1.default.gray('   ' + '─'.repeat(40)));
            });
            console.log(chalk_1.default.cyan('\n📊 Storage Info:'));
            console.log(chalk_1.default.gray(`   Total files: ${files.length}`));
            console.log(chalk_1.default.gray(`   Total size: ${Math.round(storageUsed / 1024 / 1024)} MB`));
            console.log(chalk_1.default.gray(`   Folder: ${response.data.data.folder}`));
            return;
        }
        if (options.upload) {
            const filePath = options.upload;
            if (!fs_extra_1.default.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            spinner.text = 'Uploading file...';
            const fileBuffer = await fs_extra_1.default.readFile(filePath);
            const fileName = path_1.default.basename(filePath);
            const fileSize = fileBuffer.length;
            const maxSize = 10 * 1024 * 1024;
            if (fileSize > maxSize) {
                throw new Error(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
            }
            const formData = new form_data_1.default();
            formData.append('file', fileBuffer, {
                filename: fileName,
                contentType: getMimeType(fileName)
            });
            if (options.folder) {
                formData.append('folder', options.folder);
            }
            const uploadHeaders = {
                ...headers,
                ...formData.getHeaders()
            };
            const response = await axios_1.default.post(await (0, auth_1.buildApiUrl)('/storage'), formData, {
                headers: uploadHeaders
            });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Upload failed');
            }
            const uploadedFile = response.data.data;
            spinner.succeed(chalk_1.default.green('✅ File uploaded successfully!'));
            console.log(chalk_1.default.cyan('\n📁 File Details\n'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.green(`Name: ${uploadedFile.originalFilename}`));
            console.log(chalk_1.default.green(`Size: ${Math.round(uploadedFile.size)} KB`));
            console.log(chalk_1.default.green(`Format: ${uploadedFile.format.toUpperCase()}`));
            console.log(chalk_1.default.green(`URL: ${uploadedFile.url}`));
            console.log(chalk_1.default.green(`Public ID: ${uploadedFile.publicId}`));
            if (uploadedFile.width && uploadedFile.height) {
                console.log(chalk_1.default.green(`Dimensions: ${uploadedFile.width}x${uploadedFile.height}`));
            }
            console.log(chalk_1.default.gray('\n' + '─'.repeat(50)));
            console.log(chalk_1.default.cyan('🔗 Use in your app:'));
            console.log(chalk_1.default.yellow(`  <img src="${uploadedFile.url}" alt="${uploadedFile.originalFilename}" />\n`));
            return;
        }
        if (options.delete) {
            const publicId = options.delete;
            spinner.text = 'Deleting file...';
            const response = await axios_1.default.delete(await (0, auth_1.buildApiUrl)('/storage'), {
                headers,
                data: { publicId }
            });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Delete failed');
            }
            spinner.succeed(chalk_1.default.green(`✅ File deleted successfully`));
            return;
        }
        if (options.download) {
            const publicId = options.download;
            spinner.text = 'Fetching file info...';
            const response = await axios_1.default.get(await (0, auth_1.buildApiUrl)(`/storage/${publicId}`), { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'File not found');
            }
            const fileInfo = response.data.data;
            spinner.succeed(chalk_1.default.green(`✅ File found: ${fileInfo.originalFilename}`));
            console.log(chalk_1.default.cyan('\n📁 File Information\n'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            console.log(chalk_1.default.green(`Name: ${fileInfo.originalFilename}`));
            console.log(chalk_1.default.green(`Size: ${Math.round(fileInfo.bytes / 1024)} KB`));
            console.log(chalk_1.default.green(`Format: ${fileInfo.format.toUpperCase()}`));
            console.log(chalk_1.default.green(`Type: ${fileInfo.resourceType}`));
            console.log(chalk_1.default.green(`Created: ${new Date(fileInfo.createdAt).toLocaleString()}`));
            console.log(chalk_1.default.green(`URL: ${fileInfo.url}`));
            if (fileInfo.downloadUrl) {
                console.log(chalk_1.default.cyan('\n🔗 Download URL:'));
                console.log(chalk_1.default.yellow(`  ${fileInfo.downloadUrl}`));
                console.log(chalk_1.default.gray('  (Link valid for 1 hour)'));
            }
            console.log(chalk_1.default.gray('\n' + '─'.repeat(50)));
            return;
        }
        spinner.stop();
        console.log(chalk_1.default.cyan('\n📁 Storage Operations\n'));
        console.log(chalk_1.default.gray('─'.repeat(50)));
        console.log(chalk_1.default.cyan('Usage:'));
        console.log(chalk_1.default.yellow('  mz storage --list                ') + chalk_1.default.gray('# List all files'));
        console.log(chalk_1.default.yellow('  mz storage --upload <file>       ') + chalk_1.default.gray('# Upload a file'));
        console.log(chalk_1.default.yellow('  mz storage --delete <public-id>  ') + chalk_1.default.gray('# Delete a file'));
        console.log(chalk_1.default.yellow('  mz storage --download <public-id>') + chalk_1.default.gray('# Get file info & download URL\n'));
        console.log(chalk_1.default.yellow('⚠️  File size limit: 10MB\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Storage command failed'));
        if (error.response) {
            console.error(chalk_1.default.red(`  Error ${error.response.status}: ${error.response.data?.error || 'API error'}`));
        }
        else {
            console.error(chalk_1.default.red(`  Error: ${error.message}`));
        }
    }
}
function getMimeType(filename) {
    const ext = path_1.default.extname(filename).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.zip': 'application/zip',
        '.json': 'application/json'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}
//# sourceMappingURL=storage.js.map