import chalk from 'chalk';
import ora from 'ora';
import { buildApiUrl, getAuthHeaders } from '../middleware/auth';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import FormData from 'form-data';

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
      
      const response = await axios.get(await buildApiUrl('/storage'), { headers });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch files');
      }
      
      const files: FileResource[] = response.data.data.files;
      const storageUsed = response.data.data.user?.storageUsed || 0;
      
      spinner.succeed(chalk.green(`✅ Found ${files.length} file(s) - ${Math.round(storageUsed / 1024 / 1024)} MB used`));
      
      console.log(chalk.cyan('\n📁 Storage Files\n'));
      console.log(chalk.gray('─'.repeat(80)));
      
      if (files.length === 0) {
        console.log(chalk.yellow('No files found. Upload one with: mz storage --upload <file>'));
        return;
      }

      files.forEach((file, index) => {
        console.log(chalk.bold(`\n${index + 1}. ${file.originalFilename || file.publicId.split('/').pop()}`));
        console.log(chalk.gray(`   ID: ${file.id}`));
        console.log(chalk.gray(`   Size: ${Math.round(file.size)} KB`));
        console.log(chalk.gray(`   Format: ${file.format.toUpperCase()}`));
        console.log(chalk.gray(`   Type: ${file.resourceType}`));
        console.log(chalk.gray(`   Created: ${new Date(file.createdAt).toLocaleString()}`));
        
        if (file.tags.length > 0) {
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
      console.log(chalk.gray(`   Folder: ${response.data.data.folder}`));
      
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
      const maxSize = 10 * 1024 * 1024;
      if (fileSize > maxSize) {
        throw new Error(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: getMimeType(fileName)
      });
      
      // Add optional folder
      if (options.folder) {
        formData.append('folder', options.folder);
      }

      const uploadHeaders = {
        ...headers,
        ...formData.getHeaders()
      };

      const response = await axios.post(await buildApiUrl('/storage'), formData, {
        headers: uploadHeaders
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Upload failed');
      }
      
      const uploadedFile = response.data.data;
      
      spinner.succeed(chalk.green('✅ File uploaded successfully!'));
      
      console.log(chalk.cyan('\n📁 File Details\n'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`Name: ${uploadedFile.originalFilename}`));
      console.log(chalk.green(`Size: ${Math.round(uploadedFile.size)} KB`));
      console.log(chalk.green(`Format: ${uploadedFile.format.toUpperCase()}`));
      console.log(chalk.green(`URL: ${uploadedFile.url}`));
      console.log(chalk.green(`Public ID: ${uploadedFile.publicId}`));
      
      if (uploadedFile.width && uploadedFile.height) {
        console.log(chalk.green(`Dimensions: ${uploadedFile.width}x${uploadedFile.height}`));
      }
      
      console.log(chalk.gray('\n' + '─'.repeat(50)));
      console.log(chalk.cyan('🔗 Use in your app:'));
      console.log(chalk.yellow(`  <img src="${uploadedFile.url}" alt="${uploadedFile.originalFilename}" />\n`));
      
      return;
    }

    if (options.delete) {
      const publicId = options.delete as string;
      
      spinner.text = 'Deleting file...';
      
      const response = await axios.delete(await buildApiUrl('/storage'), {
        headers,
        data: { publicId }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Delete failed');
      }
      
      spinner.succeed(chalk.green(`✅ File deleted successfully`));
      return;
    }

    if (options.download) {
      const publicId = options.download as string;
      
      spinner.text = 'Fetching file info...';
      
      const response = await axios.get(await buildApiUrl(`/storage/${publicId}`), { headers });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'File not found');
      }
      
      const fileInfo = response.data.data;
      
      spinner.succeed(chalk.green(`✅ File found: ${fileInfo.originalFilename}`));
      
      console.log(chalk.cyan('\n📁 File Information\n'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`Name: ${fileInfo.originalFilename}`));
      console.log(chalk.green(`Size: ${Math.round(fileInfo.bytes / 1024)} KB`));
      console.log(chalk.green(`Format: ${fileInfo.format.toUpperCase()}`));
      console.log(chalk.green(`Type: ${fileInfo.resourceType}`));
      console.log(chalk.green(`Created: ${new Date(fileInfo.createdAt).toLocaleString()}`));
      console.log(chalk.green(`URL: ${fileInfo.url}`));
      
      if (fileInfo.downloadUrl) {
        console.log(chalk.cyan('\n🔗 Download URL:'));
        console.log(chalk.yellow(`  ${fileInfo.downloadUrl}`));
        console.log(chalk.gray('  (Link valid for 1 hour)'));
      }
      
      console.log(chalk.gray('\n' + '─'.repeat(50)));
      return;
    }

    // Default help
    spinner.stop();
    
    console.log(chalk.cyan('\n📁 Storage Operations\n'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.cyan('Usage:'));
    console.log(chalk.yellow('  mz storage --list                ') + chalk.gray('# List all files'));
    console.log(chalk.yellow('  mz storage --upload <file>       ') + chalk.gray('# Upload a file'));
    console.log(chalk.yellow('  mz storage --delete <public-id>  ') + chalk.gray('# Delete a file'));
    console.log(chalk.yellow('  mz storage --download <public-id>') + chalk.gray('# Get file info & download URL\n'));
    console.log(chalk.yellow('⚠️  File size limit: 10MB\n'));

  } catch (error: any) {
    spinner.fail(chalk.red('❌ Storage command failed'));
    
    if (error.response) {
      console.error(chalk.red(`  Error ${error.response.status}: ${error.response.data?.error || 'API error'}`));
    } else {
      console.error(chalk.red(`  Error: ${error.message}`));
    }
  }
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
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
