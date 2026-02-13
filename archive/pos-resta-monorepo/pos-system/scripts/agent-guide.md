# 🤖 Agent Navigation Guide

## Problem
Agents were getting lost in the project structure, trying to navigate to non-existent paths like:
```
cd apps/frontend  # When already in apps/backend
```

## Solution
Created navigation helpers that automatically detect project structure and provide safe navigation.

## 📁 Project Structure
```
pos-system/
├── apps/
│   ├── backend/     # Node.js/Express API
│   └── frontend/    # React/Vite app
├── packages/
│   └── shared/      # Shared TypeScript types
├── scripts/         # Helper scripts
└── docs/           # Documentation files
```

## 🛠️ Available Tools

### 1. JavaScript Navigation Helper
**File:** `scripts/navigation-helper.js`

```bash
# Show project structure and current location
node scripts/navigation-helper.js show

# Navigate to specific location
node scripts/navigation-helper.js navigate backend
node scripts/navigation-helper.js navigate frontend
node scripts/navigation-helper.js navigate root

# Get absolute path for location
node scripts/navigation-helper.js path backend

# Get relative path from current location
node scripts/navigation-helper.js relative frontend
```

### 2. PowerShell Commands
**File:** `scripts/agent-commands.ps1`

```powershell
# Load the commands
. .\scripts\agent-commands.ps1

# Show project structure
Show-ProjectStructure

# Show current location
Show-CurrentLocation

# Navigate to locations
Navigate-To backend
Navigate-To frontend
Navigate-To root

# Quick navigation aliases
Go-Backend
Go-Frontend
Go-Root

# Execute commands in specific locations
Invoke-InLocation backend "npm run dev"
Invoke-InLocation frontend "npm install"

# Common project commands
Start-Backend
Start-Frontend
Install-Backend
Install-Frontend
Seed-Database
Push-Database
Generate-Prisma
```

## 🎯 Available Locations

| Location | Description | Path |
|----------|-------------|------|
| `root` / `project` | Project root directory | `pos-system/` |
| `backend` | Backend application | `pos-system/apps/backend/` |
| `frontend` | Frontend application | `pos-system/apps/frontend/` |
| `shared` | Shared packages | `pos-system/packages/shared/` |
| `scripts` | Helper scripts | `pos-system/scripts/` |
| `docs` | Documentation | `pos-system/` |

## ✅ Best Practices for Agents

### 1. Always Check Current Location
```powershell
Show-CurrentLocation
```

### 2. Use Navigation Helpers
```powershell
# ❌ Wrong - can fail
cd apps/frontend

# ✅ Correct - always works
Navigate-To frontend
```

### 3. Execute Commands in Specific Locations
```powershell
# ❌ Wrong - might execute in wrong directory
npm run dev

# ✅ Correct - executes in correct directory
Invoke-InLocation backend "npm run dev"
```

### 4. Use Project-Specific Commands
```powershell
# ✅ Best - uses predefined commands
Start-Backend
Seed-Database
Push-Database
```

## 🔧 Troubleshooting

### Problem: "Cannot find path"
**Solution:** Use navigation helpers instead of relative paths

### Problem: Command fails in wrong directory
**Solution:** Use `Invoke-InLocation` or navigate first

### Problem: Agent gets lost
**Solution:** Use `Show-CurrentLocation` and `Show-ProjectStructure`

## 📝 Example Workflows

### Starting Development Servers
```powershell
# Load navigation commands
. .\scripts\agent-commands.ps1

# Start backend
Start-Backend

# In another terminal, start frontend
Start-Frontend
```

### Database Operations
```powershell
# Load navigation commands
. .\scripts\agent-commands.ps1

# Push schema changes
Push-Database

# Generate Prisma client
Generate-Prisma

# Seed database
Seed-Database
```

### Installing Dependencies
```powershell
# Load navigation commands
. .\scripts\agent-commands.ps1

# Install backend dependencies
Install-Backend

# Install frontend dependencies
Install-Frontend
```

## 🚀 Quick Start for Agents

1. **Load the navigation commands:**
   ```powershell
   . .\scripts\agent-commands.ps1
   ```

2. **Check your location:**
   ```powershell
   Show-CurrentLocation
   ```

3. **Navigate safely:**
   ```powershell
   Navigate-To backend
   ```

4. **Execute commands:**
   ```powershell
   Invoke-InLocation backend "npm run dev"
   ```

This system ensures agents never get lost in the project structure! 🎉