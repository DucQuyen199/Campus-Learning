#!/bin/bash

# Script to build multi-platform versions of the user app and create a Git tag
# Author: Quyen Nguyen

# Configuration
APP_DIR="/Users/quyennguyen/Documents/campust/frontend/user-app"
RELEASE_DIR="$APP_DIR/release"
VERSION=$(node -p "require('$APP_DIR/package.json').version")
TAG_NAME="user-app-v$VERSION"
TAG_MESSAGE="User App Release v$VERSION with all platform builds"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting build process for User App v$VERSION${NC}"
echo -e "${BLUE}Platform builds: iOS, Android, macOS, Windows${NC}"
echo "----------------------------------------"

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check platform-specific build requirements
check_requirements() {
  echo -e "${BLUE}Checking build requirements...${NC}"
  
  # Check for Node.js and npm
  if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
  fi
  
  # Check for Xcode (iOS build)
  if [[ "$1" == *"ios"* ]]; then
    if ! command_exists xcodebuild; then
      echo -e "${RED}Warning: Xcode is not installed. iOS build will be skipped${NC}"
      return 1
    fi
  fi
  
  # Check for Android SDK (Android build)
  if [[ "$1" == *"android"* ]]; then
    if [[ -z "$ANDROID_HOME" ]]; then
      echo -e "${RED}Warning: ANDROID_HOME is not set. Android build will be skipped${NC}"
      return 1
    fi
  fi
  
  # Check for electron-builder (Desktop builds)
  if [[ "$1" == *"electron"* ]]; then
    if ! npm list -g electron-builder > /dev/null 2>&1; then
      echo -e "${RED}Warning: electron-builder is not installed globally${NC}"
      echo -e "${YELLOW}Installing electron-builder...${NC}"
      npm install -g electron-builder
    fi
  fi
  
  return 0
}

# Navigate to app directory
cd "$APP_DIR" || { echo -e "${RED}Error: Could not navigate to app directory${NC}"; exit 1; }

# Create release directory if it doesn't exist
mkdir -p "$RELEASE_DIR/platforms"

# Clean previous build artifacts
echo -e "${BLUE}Cleaning previous builds...${NC}"
rm -rf dist
npm run build

# Build for iOS
echo -e "\n${YELLOW}Building for iOS...${NC}"
if check_requirements "ios"; then
  npm run cap:sync
  cd ios/App || exit 1
  xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -sdk iphoneos -archivePath "$RELEASE_DIR/platforms/CampusLearning.xcarchive" archive
  xcodebuild -exportArchive -archivePath "$RELEASE_DIR/platforms/CampusLearning.xcarchive" -exportOptionsPlist exportOptions.plist -exportPath "$RELEASE_DIR/platforms/ios"
  cd "$APP_DIR" || exit 1
  echo -e "${GREEN}iOS build completed successfully${NC}"
else
  echo -e "${YELLOW}Skipping iOS build due to missing requirements${NC}"
fi

# Build for Android
echo -e "\n${YELLOW}Building for Android...${NC}"
if check_requirements "android"; then
  npm run cap:sync
  cd android || exit 1
  ./gradlew assembleRelease
  cp app/build/outputs/apk/release/app-release.apk "$RELEASE_DIR/platforms/CampusLearning.apk"
  cd "$APP_DIR" || exit 1
  echo -e "${GREEN}Android build completed successfully${NC}"
else
  echo -e "${YELLOW}Skipping Android build due to missing requirements${NC}"
fi

# Build for macOS (DMG)
echo -e "\n${YELLOW}Building for macOS...${NC}"
if check_requirements "electron"; then
  npm run electron:build:mac
  mkdir -p "$RELEASE_DIR/platforms"
  cp "$RELEASE_DIR/CampusLearning App-$VERSION.dmg" "$RELEASE_DIR/platforms/CampusLearning-macOS.dmg" 2>/dev/null || echo -e "${YELLOW}Warning: Could not copy DMG file${NC}"
  echo -e "${GREEN}macOS build completed successfully${NC}"
else
  echo -e "${YELLOW}Skipping macOS build due to missing requirements${NC}"
fi

# Build for Windows (EXE)
echo -e "\n${YELLOW}Building for Windows...${NC}"
if check_requirements "electron"; then
  npm run electron:build:win
  mkdir -p "$RELEASE_DIR/platforms"
  cp "$RELEASE_DIR/CampusLearning App Setup $VERSION.exe" "$RELEASE_DIR/platforms/CampusLearning-Windows.exe" 2>/dev/null || echo -e "${YELLOW}Warning: Could not copy EXE file${NC}"
  echo -e "${GREEN}Windows build completed successfully${NC}"
else
  echo -e "${YELLOW}Skipping Windows build due to missing requirements${NC}"
fi

# Create build summary
echo -e "\n${BLUE}Creating build summary...${NC}"
cat > "$RELEASE_DIR/BUILD-INFO.md" << EOF
# CampusLearning User App Build Summary

**Version:** $VERSION
**Build Date:** $(date "+%Y-%m-%d %H:%M:%S")

## Platforms

| Platform | File | Status |
|----------|------|--------|
| iOS | CampusLearning.ipa | $([ -f "$RELEASE_DIR/platforms/ios/CampusLearning.ipa" ] && echo "✅ Built" || echo "❌ Not built") |
| Android | CampusLearning.apk | $([ -f "$RELEASE_DIR/platforms/CampusLearning.apk" ] && echo "✅ Built" || echo "❌ Not built") |
| macOS | CampusLearning-macOS.dmg | $([ -f "$RELEASE_DIR/platforms/CampusLearning-macOS.dmg" ] && echo "✅ Built" || echo "❌ Not built") |
| Windows | CampusLearning-Windows.exe | $([ -f "$RELEASE_DIR/platforms/CampusLearning-Windows.exe" ] && echo "✅ Built" || echo "❌ Not built") |

## Installation Instructions

### iOS
- Copy the IPA file to your device using iTunes or other installation methods.
- Trust the developer certificate on your device.

### Android
- Copy the APK file to your Android device.
- Enable "Install from Unknown Sources" in settings.
- Open the APK file to install.

### macOS
- Open the DMG file.
- Drag the application to your Applications folder.

### Windows
- Run the installer EXE file.
- Follow the installation prompts.
EOF

# Create Git tag with the builds
echo -e "\n${YELLOW}Creating Git tag with builds...${NC}"

# Add the release files to Git
cd "$APP_DIR/.." || exit 1
mkdir -p user-app/release/platforms
touch user-app/release/platforms/.gitkeep
git add user-app/release/platforms/.gitkeep
git add user-app/release/BUILD-INFO.md

# Commit the release files
git commit -m "build: user-app v$VERSION platform builds"

# Create a tag for this release - use -f to force if it already exists
git tag -f -a "$TAG_NAME" -m "$TAG_MESSAGE"

# Push the tag to remote
echo -e "\n${YELLOW}Do you want to push the tag to remote? (y/n)${NC}"
read -r PUSH_CHOICE

if [[ $PUSH_CHOICE == "y" || $PUSH_CHOICE == "Y" ]]; then
  git push -f origin "$TAG_NAME"
  echo -e "${GREEN}Successfully pushed tag $TAG_NAME to remote${NC}"
else
  echo -e "${BLUE}Tag created locally. To push later, use: git push origin $TAG_NAME${NC}"
fi

echo -e "\n${GREEN}Build and tag process completed successfully!${NC}"
echo -e "${BLUE}Release files available at: $RELEASE_DIR/platforms${NC}"
echo -e "${BLUE}Tag name: $TAG_NAME${NC}" 