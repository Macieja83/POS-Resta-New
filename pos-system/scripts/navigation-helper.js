/**
 * Navigation Helper for POS System Project
 * Helps agents navigate correctly through the project structure
 */

const path = require('path');
const fs = require('fs');

class ProjectNavigation {
  constructor() {
    this.projectRoot = this.findProjectRoot();
    this.structure = this.getProjectStructure();
  }

  /**
   * Find the project root directory
   */
  findProjectRoot() {
    let currentDir = process.cwd();
    
    // Look for project root indicators
    while (currentDir !== path.dirname(currentDir)) {
      const indicators = [
        'package.json',
        'pnpm-workspace.yaml',
        'apps',
        'packages'
      ];
      
      const hasIndicators = indicators.some(indicator => 
        fs.existsSync(path.join(currentDir, indicator))
      );
      
      if (hasIndicators) {
        return currentDir;
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    // Fallback to current directory
    return process.cwd();
  }

  /**
   * Get project structure mapping
   */
  getProjectStructure() {
    return {
      root: this.projectRoot,
      apps: {
        backend: path.join(this.projectRoot, 'apps', 'backend'),
        frontend: path.join(this.projectRoot, 'apps', 'frontend')
      },
      packages: {
        shared: path.join(this.projectRoot, 'packages', 'shared')
      },
      scripts: path.join(this.projectRoot, 'scripts'),
      docs: this.projectRoot // Documentation files are in root
    };
  }

  /**
   * Get current location relative to project
   */
  getCurrentLocation() {
    const currentDir = process.cwd();
    const relativePath = path.relative(this.projectRoot, currentDir);
    
    return {
      absolute: currentDir,
      relative: relativePath,
      isInProject: currentDir.startsWith(this.projectRoot)
    };
  }

  /**
   * Navigate to a specific project location
   */
  navigateTo(location) {
    const targetPath = this.getPath(location);
    if (targetPath) {
      process.chdir(targetPath);
      return targetPath;
    }
    throw new Error(`Unknown location: ${location}`);
  }

  /**
   * Get absolute path for a location
   */
  getPath(location) {
    const locations = {
      // Root locations
      'root': this.structure.root,
      'project': this.structure.root,
      
      // App locations
      'backend': this.structure.apps.backend,
      'frontend': this.structure.apps.frontend,
      'apps/backend': this.structure.apps.backend,
      'apps/frontend': this.structure.apps.frontend,
      
      // Package locations
      'shared': this.structure.packages.shared,
      'packages/shared': this.structure.packages.shared,
      
      // Other locations
      'scripts': this.structure.scripts,
      'docs': this.structure.docs
    };

    return locations[location] || null;
  }

  /**
   * Get relative path from current location to target
   */
  getRelativePath(target) {
    const currentDir = process.cwd();
    const targetPath = this.getPath(target);
    
    if (!targetPath) {
      throw new Error(`Unknown target: ${target}`);
    }
    
    return path.relative(currentDir, targetPath);
  }

  /**
   * Execute command in specific location
   */
  async executeIn(location, command) {
    const originalDir = process.cwd();
    const targetPath = this.getPath(location);
    
    if (!targetPath) {
      throw new Error(`Unknown location: ${location}`);
    }
    
    try {
      process.chdir(targetPath);
      console.log(`📁 Executing in: ${targetPath}`);
      console.log(`💻 Command: ${command}`);
      
      // Return the command to execute
      return command;
    } catch (error) {
      process.chdir(originalDir);
      throw error;
    }
  }

  /**
   * Show project structure
   */
  showStructure() {
    console.log('📁 Project Structure:');
    console.log(`Root: ${this.structure.root}`);
    console.log(`Backend: ${this.structure.apps.backend}`);
    console.log(`Frontend: ${this.structure.apps.frontend}`);
    console.log(`Shared: ${this.structure.packages.shared}`);
    console.log(`Scripts: ${this.structure.scripts}`);
  }

  /**
   * Show current location
   */
  showCurrentLocation() {
    const location = this.getCurrentLocation();
    console.log('📍 Current Location:');
    console.log(`Absolute: ${location.absolute}`);
    console.log(`Relative: ${location.relative}`);
    console.log(`In Project: ${location.isInProject}`);
  }
}

// Export for use in other scripts
module.exports = ProjectNavigation;

// CLI usage
if (require.main === module) {
  const nav = new ProjectNavigation();
  
  const command = process.argv[2];
  const target = process.argv[3];
  
  switch (command) {
    case 'show':
      nav.showStructure();
      nav.showCurrentLocation();
      break;
      
    case 'navigate':
      if (target) {
        const path = nav.navigateTo(target);
        console.log(`✅ Navigated to: ${path}`);
      } else {
        console.log('❌ Please specify target location');
      }
      break;
      
    case 'path':
      if (target) {
        const path = nav.getPath(target);
        console.log(`Path for ${target}: ${path}`);
      } else {
        console.log('❌ Please specify target location');
      }
      break;
      
    case 'relative':
      if (target) {
        const relativePath = nav.getRelativePath(target);
        console.log(`Relative path to ${target}: ${relativePath}`);
      } else {
        console.log('❌ Please specify target location');
      }
      break;
      
    default:
      console.log('Usage:');
      console.log('  node navigation-helper.js show');
      console.log('  node navigation-helper.js navigate <location>');
      console.log('  node navigation-helper.js path <location>');
      console.log('  node navigation-helper.js relative <location>');
      console.log('');
      console.log('Available locations:');
      console.log('  root, project, backend, frontend, shared, scripts, docs');
      break;
  }
}