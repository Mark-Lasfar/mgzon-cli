"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const mime_types_1 = __importDefault(require("mime-types"));
async function storageCommand(options) {
    const spinner = (0, ora_1.default)('Processing...').start();
    try {
        const headers = await (0, auth_1.getAuthHeaders)();
        if (options.list) {
            spinner.text = 'Fetching files...';
            const apiUrl = await (0, auth_1.buildApiUrl)('/storage');
            console.log(chalk_1.default.gray(`   Debug: Fetching from: ${apiUrl}`));
            const response = await axios_1.default.get(apiUrl, { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Failed to fetch files');
            }
            const files = response.data.data.files || [];
            const storageUsed = response.data.data.user?.storageUsed || 0;
            const folder = response.data.data.folder || 'mgzon-uploads';
            spinner.succeed(chalk_1.default.green(`✅ Found ${files.length} file(s) in "${folder}"`));
            console.log(chalk_1.default.cyan('\n📁 Storage Files\n'));
            console.log(chalk_1.default.gray('─'.repeat(80)));
            if (files.length === 0) {
                console.log(chalk_1.default.yellow('No files found. Upload one with: mz storage --upload <file>'));
                console.log(chalk_1.default.gray('   Available commands:'));
                console.log(chalk_1.default.cyan('     mz storage --upload image.jpg'));
                console.log(chalk_1.default.cyan('     mz storage --upload document.pdf'));
                console.log(chalk_1.default.cyan('     mz storage --list --limit=20'));
                return;
            }
            files.forEach((file, index) => {
                const fileSize = Math.round(file.bytes / 1024);
                const fileName = file.originalFilename || file.publicId.split('/').pop() || 'Unknown';
                console.log(chalk_1.default.bold(`\n${index + 1}. ${fileName}`));
                console.log(chalk_1.default.gray(`   ID: ${file.id || file.publicId}`));
                console.log(chalk_1.default.gray(`   Size: ${fileSize} KB`));
                console.log(chalk_1.default.gray(`   Format: ${file.format?.toUpperCase() || 'Unknown'}`));
                console.log(chalk_1.default.gray(`   Type: ${file.resourceType || 'Unknown'}`));
                console.log(chalk_1.default.gray(`   Created: ${new Date(file.createdAt).toLocaleString()}`));
                if (file.tags && file.tags.length > 0) {
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
            console.log(chalk_1.default.gray(`   Folder: ${folder}`));
            console.log(chalk_1.default.gray(`   API: ${await (0, auth_1.buildApiUrl)('/storage')}`));
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
            const fileExt = path_1.default.extname(fileName).toLowerCase();
            const mimeType = mime_types_1.default.lookup(filePath) || 'application/octet-stream';
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/zip'];
            if (!allowedTypes.includes(mimeType)) {
                throw new Error(`File type not allowed: ${mimeType}. Allowed: ${allowedTypes.join(', ')}`);
            }
            const formData = new form_data_1.default();
            formData.append('file', fileBuffer, {
                filename: fileName,
                contentType: mimeType
            });
            if (options.folder) {
                formData.append('folder', options.folder);
            }
            if (options.publicId) {
                formData.append('publicId', options.publicId);
            }
            const uploadHeaders = {
                ...headers,
                ...formData.getHeaders()
            };
            const apiUrl = await (0, auth_1.buildApiUrl)('/storage');
            console.log(chalk_1.default.gray(`   Debug: Uploading to: ${apiUrl}`));
            const response = await axios_1.default.post(apiUrl, formData, {
                headers: uploadHeaders,
                timeout: 30000
            });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Upload failed');
            }
            const uploadedFile = response.data.data;
            spinner.succeed(chalk_1.default.green('✅ File uploaded successfully!'));
            console.log(chalk_1.default.cyan('\n📁 File Details\n'));
            console.log(chalk_1.default.gray('─'.repeat(60)));
            console.log(chalk_1.default.green(`Name:     ${uploadedFile.originalFilename || fileName}`));
            console.log(chalk_1.default.green(`Size:     ${Math.round(uploadedFile.bytes / 1024)} KB`));
            console.log(chalk_1.default.green(`Format:   ${uploadedFile.format?.toUpperCase() || 'Unknown'}`));
            console.log(chalk_1.default.green(`Public ID: ${uploadedFile.publicId}`));
            console.log(chalk_1.default.green(`URL:      ${uploadedFile.url}`));
            if (uploadedFile.width && uploadedFile.height) {
                console.log(chalk_1.default.green(`Dimensions: ${uploadedFile.width}x${uploadedFile.height}`));
            }
            if (uploadedFile.createdAt) {
                console.log(chalk_1.default.green(`Uploaded: ${new Date(uploadedFile.createdAt).toLocaleString()}`));
            }
            console.log(chalk_1.default.gray('\n' + '─'.repeat(60)));
            console.log(chalk_1.default.cyan('🔗 Use in your app:'));
            console.log(chalk_1.default.yellow(`  <img src="${uploadedFile.url}" alt="${fileName}" />`));
            console.log(chalk_1.default.cyan('\n📋 API Usage:'));
            console.log(chalk_1.default.gray(`  GET ${await (0, auth_1.buildApiUrl)(`/storage/${uploadedFile.publicId}`)}`));
            console.log(chalk_1.default.gray(`  DELETE ${await (0, auth_1.buildApiUrl)('/storage')}`));
            console.log('');
            return;
        }
        if (options.delete) {
            const publicId = options.delete;
            if (!publicId) {
                throw new Error('Public ID is required for deletion');
            }
            spinner.text = 'Deleting file...';
            const apiUrl = await (0, auth_1.buildApiUrl)('/storage');
            console.log(chalk_1.default.gray(`   Debug: Deleting from: ${apiUrl}`));
            const response = await axios_1.default.delete(apiUrl, {
                headers,
                data: { publicId }
            });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Delete failed');
            }
            spinner.succeed(chalk_1.default.green(`✅ File "${publicId}" deleted successfully`));
            console.log(chalk_1.default.cyan('\n🗑️  Delete Confirmation\n'));
            console.log(chalk_1.default.gray('─'.repeat(40)));
            console.log(chalk_1.default.green(`Public ID: ${publicId}`));
            console.log(chalk_1.default.green(`Status: Deleted`));
            console.log(chalk_1.default.green(`Time: ${new Date().toLocaleString()}`));
            console.log(chalk_1.default.gray('─'.repeat(40)));
            return;
        }
        if (options.download || options.info) {
            const publicId = (options.download || options.info);
            if (!publicId) {
                throw new Error('Public ID is required');
            }
            spinner.text = 'Fetching file info...';
            const apiUrl = await (0, auth_1.buildApiUrl)(`/storage/${publicId}`);
            console.log(chalk_1.default.gray(`   Debug: Fetching from: ${apiUrl}`));
            const response = await axios_1.default.get(apiUrl, { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'File not found');
            }
            const fileInfo = response.data.data;
            spinner.succeed(chalk_1.default.green(`✅ File found: ${fileInfo.originalFilename || publicId}`));
            console.log(chalk_1.default.cyan('\n📁 File Information\n'));
            console.log(chalk_1.default.gray('─'.repeat(60)));
            console.log(chalk_1.default.green(`Name: ${fileInfo.originalFilename || 'N/A'}`));
            console.log(chalk_1.default.green(`Public ID: ${fileInfo.publicId}`));
            console.log(chalk_1.default.green(`Size: ${Math.round(fileInfo.bytes / 1024)} KB`));
            console.log(chalk_1.default.green(`Format: ${fileInfo.format?.toUpperCase() || 'Unknown'}`));
            console.log(chalk_1.default.green(`Type: ${fileInfo.resourceType || 'Unknown'}`));
            console.log(chalk_1.default.green(`Created: ${new Date(fileInfo.createdAt).toLocaleString()}`));
            console.log(chalk_1.default.green(`URL: ${fileInfo.url}`));
            if (fileInfo.downloadUrl) {
                console.log(chalk_1.default.cyan('\n🔗 Download URL:'));
                console.log(chalk_1.default.yellow(`  ${fileInfo.downloadUrl}`));
                console.log(chalk_1.default.gray('  (Link valid for 1 hour)'));
            }
            if (fileInfo.width && fileInfo.height) {
                console.log(chalk_1.default.green(`Dimensions: ${fileInfo.width}x${fileInfo.height}`));
            }
            if (fileInfo.tags && fileInfo.tags.length > 0) {
                console.log(chalk_1.default.green(`Tags: ${fileInfo.tags.join(', ')}`));
            }
            if (fileInfo.metadata && Object.keys(fileInfo.metadata).length > 0) {
                console.log(chalk_1.default.green('\n📊 Metadata:'));
                Object.entries(fileInfo.metadata).forEach(([key, value]) => {
                    console.log(chalk_1.default.gray(`  ${key}: ${value}`));
                });
            }
            console.log(chalk_1.default.gray('\n' + '─'.repeat(60)));
            if (options.download && fileInfo.downloadUrl) {
                console.log(chalk_1.default.cyan('\n💾 Download Instructions:'));
                console.log(chalk_1.default.yellow(`  curl -L "${fileInfo.downloadUrl}" -o "${fileInfo.originalFilename || 'download'}"`));
                console.log(chalk_1.default.gray('  Or open the URL in your browser'));
            }
            return;
        }
        if (options.update) {
            const publicId = options.update;
            if (!publicId) {
                throw new Error('Public ID is required for update');
            }
            spinner.stop();
            console.log(chalk_1.default.cyan('\n✏️  Update File Metadata\n'));
            console.log(chalk_1.default.gray('─'.repeat(50)));
            const { default: inquirer } = await Promise.resolve().then(() => __importStar(require('inquirer')));
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'tags',
                    message: 'Tags (comma separated):',
                    default: ''
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'Description:',
                    default: ''
                }
            ]);
            const updateData = {};
            if (answers.tags) {
                updateData.tags = answers.tags.split(',').map((tag) => tag.trim());
            }
            if (answers.description) {
                updateData.context = { description: answers.description };
            }
            spinner.start('Updating file metadata...');
            const apiUrl = await (0, auth_1.buildApiUrl)(`/storage/${publicId}`);
            console.log(chalk_1.default.gray(`   Debug: Updating at: ${apiUrl}`));
            const response = await axios_1.default.put(apiUrl, updateData, { headers });
            if (!response.data.success) {
                throw new Error(response.data.error || 'Update failed');
            }
            spinner.succeed(chalk_1.default.green(`✅ File metadata updated successfully`));
            console.log(chalk_1.default.gray('\n' + '─'.repeat(40)));
            console.log(chalk_1.default.green(`Public ID: ${publicId}`));
            console.log(chalk_1.default.green(`Updated: ${new Date().toLocaleString()}`));
            console.log(chalk_1.default.gray('─'.repeat(40)));
            return;
        }
        spinner.stop();
        console.log(chalk_1.default.cyan('\n📁 Storage Operations\n'));
        console.log(chalk_1.default.gray('─'.repeat(60)));
        console.log(chalk_1.default.cyan('Usage:'));
        console.log(chalk_1.default.yellow('  mz storage --list                      ') + chalk_1.default.gray('# List all files'));
        console.log(chalk_1.default.yellow('  mz storage --upload <file>             ') + chalk_1.default.gray('# Upload a file'));
        console.log(chalk_1.default.yellow('  mz storage --delete <public-id>        ') + chalk_1.default.gray('# Delete a file'));
        console.log(chalk_1.default.yellow('  mz storage --info <public-id>          ') + chalk_1.default.gray('# Get file info'));
        console.log(chalk_1.default.yellow('  mz storage --download <public-id>      ') + chalk_1.default.gray('# Get download URL'));
        console.log(chalk_1.default.yellow('  mz storage --update <public-id>        ') + chalk_1.default.gray('# Update file metadata\n'));
        console.log(chalk_1.default.cyan('Examples:'));
        console.log(chalk_1.default.gray('  mz storage --list --limit=10'));
        console.log(chalk_1.default.gray('  mz storage --upload image.jpg --folder=products'));
        console.log(chalk_1.default.gray('  mz storage --delete user_123_avatar'));
        console.log(chalk_1.default.gray('  mz storage --info image_1234567890\n'));
        console.log(chalk_1.default.yellow('⚠️  Limits:'));
        console.log(chalk_1.default.gray('  • Max file size: 10MB'));
        console.log(chalk_1.default.gray('  • Allowed types: Images, PDF, ZIP'));
        console.log(chalk_1.default.gray('  • Storage: Cloudinary managed\n'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red('❌ Storage command failed'));
        if (error.response) {
            const errorData = error.response.data;
            console.error(chalk_1.default.red(`  Error ${error.response.status}: ${errorData?.error || errorData?.message || 'API error'}`));
            if (error.response.status === 401) {
                console.error(chalk_1.default.yellow('  Run: mz login to authenticate'));
            }
            else if (error.response.status === 403) {
                console.error(chalk_1.default.yellow('  You don\'t have permission to access this file'));
            }
            else if (error.response.status === 404) {
                console.error(chalk_1.default.yellow('  File not found. Check the public ID.'));
            }
        }
        else {
            console.error(chalk_1.default.red(`  Error: ${error.message}`));
        }
        console.log(chalk_1.default.gray('\n🔧 Debug Info:'));
        try {
            const apiUrl = await (0, auth_1.buildApiUrl)('/storage');
            console.log(chalk_1.default.cyan(`   API URL: ${apiUrl}`));
        }
        catch (e) {
            console.log(chalk_1.default.cyan('   Could not get API URL'));
        }
    }
}
