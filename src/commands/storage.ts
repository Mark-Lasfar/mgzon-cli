// /workspaces/mgzon-cli/src/commands/storage.ts
import chalk from 'chalk';
import ora from 'ora';
import { buildApiUrl, getAuthHeaders } from '../middleware/auth';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import FormData from 'form-data';
import mime from 'mime-types';

interface FileResource {
  id: string;
  url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  resourceType: string;
  createdAt: string;
  publicId: string;
  folder: string;
  size: number;
  tags: string[];
  originalFilename: string;
}

export async function storageCommand(options: any) {
  const spinner = ora('Processing...').start();

  try {
    const headers = await getAuthHeaders();

    if (options.list) {
      spinner.text = 'Fetching files...';
      
      // ⭐ تصحيح: استخدام buildApiUrl بشكل صحيح
      const apiUrl = await buildApiUrl('/storage');
      console.log(chalk.gray(`   Debug: Fetching from: ${apiUrl}`));
      
      const response = await axios.get(apiUrl, { headers });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch files');
      }
      
      const files: FileResource[] = response.data.data.files || [];
      const storageUsed = response.data.data.user?.storageUsed || 0;
      const folder = response.data.data.folder || 'mgzon-uploads';
      
      spinner.succeed(chalk.green(`✅ Found ${files.length} file(s) in "${folder}"`));
      
      console.log(chalk.cyan('\n📁 Storage Files\n'));
      console.log(chalk.gray('─'.repeat(80)));
      
      if (files.length === 0) {
        console.log(chalk.yellow('No files found. Upload one with: mz storage --upload <file>'));
        console.log(chalk.gray('   Available commands:'));
        console.log(chalk.cyan('     mz storage --upload image.jpg'));
        console.log(chalk.cyan('     mz storage --upload document.pdf'));
        console.log(chalk.cyan('     mz storage --list --limit=20'));
        return;
      }

      files.forEach((file, index) => {
        const fileSize = Math.round(file.bytes / 1024); // KB
        const fileName = file.originalFilename || file.publicId.split('/').pop() || 'Unknown';
        
        console.log(chalk.bold(`\n${index + 1}. ${fileName}`));
        console.log(chalk.gray(`   ID: ${file.id || file.publicId}`));
        console.log(chalk.gray(`   Size: ${fileSize} KB`));
        console.log(chalk.gray(`   Format: ${file.format?.toUpperCase() || 'Unknown'}`));
        console.log(chalk.gray(`   Type: ${file.resourceType || 'Unknown'}`));
        console.log(chalk.gray(`   Created: ${new Date(file.createdAt).toLocaleString()}`));
        
        if (file.tags && file.tags.length > 0) {
          console.log(chalk.gray(`   Tags: ${file.tags.join(', ')}`));
        }
        
        if (file.width && file.height) {
          console.log(chalk.gray(`   Dimensions: ${file.width}x${file.height}`));
        }
        
        console.log(chalk.gray('   ' + '─'.repeat(40)));
      });
      
      console.log(chalk.cyan('\n📊 Storage Info:'));
      console.log(chalk.gray(`   Total files: ${files.length}`));
      console.log(chalk.gray(`   Total size: ${Math.round(storageUsed / 1024 / 1024)} MB`));
      console.log(chalk.gray(`   Folder: ${folder}`));
      console.log(chalk.gray(`   API: ${await buildApiUrl('/storage')}`));
      
      return;
    }

    if (options.upload) {
      const filePath = options.upload as string;
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      spinner.text = 'Uploading file...';
      
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      const fileSize = fileBuffer.length;
      
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (fileSize > maxSize) {
        throw new Error(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
      }

      // Get file extension and MIME type
      const fileExt = path.extname(fileName).toLowerCase();
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      
      // Check allowed types
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/zip'];
      if (!allowedTypes.includes(mimeType)) {
        throw new Error(`File type not allowed: ${mimeType}. Allowed: ${allowedTypes.join(', ')}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimeType
      });
      
      // Add optional folder
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      // Add publicId if provided
      if (options.publicId) {
        formData.append('publicId', options.publicId);
      }

      const uploadHeaders = {
        ...headers,
        ...formData.getHeaders()
      };

      // ⭐ تصحيح: استخدام buildApiUrl
      const apiUrl = await buildApiUrl('/storage');
      console.log(chalk.gray(`   Debug: Uploading to: ${apiUrl}`));
      
      const response = await axios.post(apiUrl, formData, {
        headers: uploadHeaders,
        timeout: 30000 // 30 seconds for large files
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Upload failed');
      }
      
      const uploadedFile = response.data.data;
      
      spinner.succeed(chalk.green('✅ File uploaded successfully!'));
      
      console.log(chalk.cyan('\n📁 File Details\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.green(`Name:     ${uploadedFile.originalFilename || fileName}`));
      console.log(chalk.green(`Size:     ${Math.round(uploadedFile.bytes / 1024)} KB`));
      console.log(chalk.green(`Format:   ${uploadedFile.format?.toUpperCase() || 'Unknown'}`));
      console.log(chalk.green(`Public ID: ${uploadedFile.publicId}`));
      console.log(chalk.green(`URL:      ${uploadedFile.url}`));
      
      if (uploadedFile.width && uploadedFile.height) {
        console.log(chalk.green(`Dimensions: ${uploadedFile.width}x${uploadedFile.height}`));
      }
      
      if (uploadedFile.createdAt) {
        console.log(chalk.green(`Uploaded: ${new Date(uploadedFile.createdAt).toLocaleString()}`));
      }
      
      console.log(chalk.gray('\n' + '─'.repeat(60)));
      console.log(chalk.cyan('🔗 Use in your app:'));
      console.log(chalk.yellow(`  <img src="${uploadedFile.url}" alt="${fileName}" />`));
      console.log(chalk.cyan('\n📋 API Usage:'));
      console.log(chalk.gray(`  GET ${await buildApiUrl(`/storage/${uploadedFile.publicId}`)}`));
      console.log(chalk.gray(`  DELETE ${await buildApiUrl('/storage')}`));
      console.log('');
      
      return;
    }

    if (options.delete) {
      const publicId = options.delete as string;
      
      if (!publicId) {
        throw new Error('Public ID is required for deletion');
      }
      
      spinner.text = 'Deleting file...';
      
      // ⭐ تصحيح: استخدام buildApiUrl
      const apiUrl = await buildApiUrl('/storage');
      console.log(chalk.gray(`   Debug: Deleting from: ${apiUrl}`));
      
      const response = await axios.delete(apiUrl, {
        headers,
        data: { publicId }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Delete failed');
      }
      
      spinner.succeed(chalk.green(`✅ File "${publicId}" deleted successfully`));
      
      console.log(chalk.cyan('\n🗑️  Delete Confirmation\n'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.green(`Public ID: ${publicId}`));
      console.log(chalk.green(`Status: Deleted`));
      console.log(chalk.green(`Time: ${new Date().toLocaleString()}`));
      console.log(chalk.gray('─'.repeat(40)));
      
      return;
    }

    if (options.download || options.info) {
      const publicId = (options.download || options.info) as string;
      
      if (!publicId) {
        throw new Error('Public ID is required');
      }
      
      spinner.text = 'Fetching file info...';
      
      // ⭐ تصحيح: استخدام buildApiUrl
      const apiUrl = await buildApiUrl(`/storage/${publicId}`);
      console.log(chalk.gray(`   Debug: Fetching from: ${apiUrl}`));
      
      const response = await axios.get(apiUrl, { headers });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'File not found');
      }
      
      const fileInfo = response.data.data;
      
      spinner.succeed(chalk.green(`✅ File found: ${fileInfo.originalFilename || publicId}`));
      
      console.log(chalk.cyan('\n📁 File Information\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(chalk.green(`Name: ${fileInfo.originalFilename || 'N/A'}`));
      console.log(chalk.green(`Public ID: ${fileInfo.publicId}`));
      console.log(chalk.green(`Size: ${Math.round(fileInfo.bytes / 1024)} KB`));
      console.log(chalk.green(`Format: ${fileInfo.format?.toUpperCase() || 'Unknown'}`));
      console.log(chalk.green(`Type: ${fileInfo.resourceType || 'Unknown'}`));
      console.log(chalk.green(`Created: ${new Date(fileInfo.createdAt).toLocaleString()}`));
      console.log(chalk.green(`URL: ${fileInfo.url}`));
      
      if (fileInfo.downloadUrl) {
        console.log(chalk.cyan('\n🔗 Download URL:'));
        console.log(chalk.yellow(`  ${fileInfo.downloadUrl}`));
        console.log(chalk.gray('  (Link valid for 1 hour)'));
      }
      
      if (fileInfo.width && fileInfo.height) {
        console.log(chalk.green(`Dimensions: ${fileInfo.width}x${fileInfo.height}`));
      }
      
      if (fileInfo.tags && fileInfo.tags.length > 0) {
        console.log(chalk.green(`Tags: ${fileInfo.tags.join(', ')}`));
      }
      
      if (fileInfo.metadata && Object.keys(fileInfo.metadata).length > 0) {
        console.log(chalk.green('\n📊 Metadata:'));
        Object.entries(fileInfo.metadata).forEach(([key, value]) => {
          console.log(chalk.gray(`  ${key}: ${value}`));
        });
      }
      
      console.log(chalk.gray('\n' + '─'.repeat(60)));
      
      if (options.download && fileInfo.downloadUrl) {
        console.log(chalk.cyan('\n💾 Download Instructions:'));
        console.log(chalk.yellow(`  curl -L "${fileInfo.downloadUrl}" -o "${fileInfo.originalFilename || 'download'}"`));
        console.log(chalk.gray('  Or open the URL in your browser'));
      }
      
      return;
    }

    if (options.update) {
      const publicId = options.update as string;
      
      if (!publicId) {
        throw new Error('Public ID is required for update');
      }
      
      spinner.stop();
      
      console.log(chalk.cyan('\n✏️  Update File Metadata\n'));
      console.log(chalk.gray('─'.repeat(50)));
      
      const { default: inquirer } = await import('inquirer');
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
      
      const updateData: any = {};
      
      if (answers.tags) {
        updateData.tags = answers.tags.split(',').map((tag: string) => tag.trim());
      }
      
      if (answers.description) {
        updateData.context = { description: answers.description };
      }
      
      spinner.start('Updating file metadata...');
      
      // ⭐ تصحيح: استخدام buildApiUrl
      const apiUrl = await buildApiUrl(`/storage/${publicId}`);
      console.log(chalk.gray(`   Debug: Updating at: ${apiUrl}`));
      
      const response = await axios.put(apiUrl, updateData, { headers });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Update failed');
      }
      
      spinner.succeed(chalk.green(`✅ File metadata updated successfully`));
      
      console.log(chalk.gray('\n' + '─'.repeat(40)));
      console.log(chalk.green(`Public ID: ${publicId}`));
      console.log(chalk.green(`Updated: ${new Date().toLocaleString()}`));
      console.log(chalk.gray('─'.repeat(40)));
      
      return;
    }

    // Default help
    spinner.stop();
    
    console.log(chalk.cyan('\n📁 Storage Operations\n'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.cyan('Usage:'));
    console.log(chalk.yellow('  mz storage --list                      ') + chalk.gray('# List all files'));
    console.log(chalk.yellow('  mz storage --upload <file>             ') + chalk.gray('# Upload a file'));
    console.log(chalk.yellow('  mz storage --delete <public-id>        ') + chalk.gray('# Delete a file'));
    console.log(chalk.yellow('  mz storage --info <public-id>          ') + chalk.gray('# Get file info'));
    console.log(chalk.yellow('  mz storage --download <public-id>      ') + chalk.gray('# Get download URL'));
    console.log(chalk.yellow('  mz storage --update <public-id>        ') + chalk.gray('# Update file metadata\n'));
    
    console.log(chalk.cyan('Examples:'));
    console.log(chalk.gray('  mz storage --list --limit=10'));
    console.log(chalk.gray('  mz storage --upload image.jpg --folder=products'));
    console.log(chalk.gray('  mz storage --delete user_123_avatar'));
    console.log(chalk.gray('  mz storage --info image_1234567890\n'));
    
    console.log(chalk.yellow('⚠️  Limits:'));
    console.log(chalk.gray('  • Max file size: 10MB'));
    console.log(chalk.gray('  • Allowed types: Images, PDF, ZIP'));
    console.log(chalk.gray('  • Storage: Cloudinary managed\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Storage command failed'));
    
    if (error.response) {
      const errorData = error.response.data;
      console.error(chalk.red(`  Error ${error.response.status}: ${errorData?.error || errorData?.message || 'API error'}`));
      
      if (error.response.status === 401) {
        console.error(chalk.yellow('  Run: mz login to authenticate'));
      } else if (error.response.status === 403) {
        console.error(chalk.yellow('  You don\'t have permission to access this file'));
      } else if (error.response.status === 404) {
        console.error(chalk.yellow('  File not found. Check the public ID.'));
      }
    } else {
      console.error(chalk.red(`  Error: ${error.message}`));
    }
    
    // Debug info
    console.log(chalk.gray('\n🔧 Debug Info:'));
    try {
      const apiUrl = await buildApiUrl('/storage');
      console.log(chalk.cyan(`   API URL: ${apiUrl}`));
    } catch (e) {
      console.log(chalk.cyan('   Could not get API URL'));
    }
  }
}