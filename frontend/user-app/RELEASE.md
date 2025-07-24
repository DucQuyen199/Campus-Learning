# User App Release Process

This document describes the process for building and releasing the CampusLearning User App across multiple platforms (iOS, Android, macOS, Windows) and creating Git tags that include these builds.

## Manual Release Process

### Prerequisites

- Node.js and npm
- Xcode (for iOS builds)
- Android SDK and ANDROID_HOME set (for Android builds)
- electron-builder (for desktop builds)

### Using the Build Script

1. Make sure your code is ready for release
2. Navigate to the user-app directory
3. Run the build script:

```bash
./build-and-tag.sh
```

The script will:
- Build the app for all platforms (iOS, Android, macOS, Windows)
- Create a release directory with all platform builds
- Generate a BUILD-INFO.md file
- Create a Git tag with the current version
- Optionally push the tag to the remote repository

### Manual Version Update

If you need to update the version number:

1. Edit `package.json` to update the version field
2. Run the build script as described above

## Automated Release Process (GitHub Actions)

We have a GitHub Actions workflow that automatically builds and creates releases.

### Triggering an Automated Release

There are two ways to trigger the workflow:

1. **Push a tag with the release- prefix**:
   ```bash
   git tag release-1.0.0
   git push origin release-1.0.0
   ```

2. **Use the GitHub Actions workflow dispatch**:
   - Go to Actions tab in the GitHub repository
   - Select "Build and Release User App" workflow
   - Click "Run workflow"
   - Enter the version number (e.g., 1.0.0)
   - Click "Run workflow"

### Release Artifacts

The GitHub Actions workflow will:
- Build the app for Android, macOS, and Windows
- Create an archive for iOS (requires manual signing)
- Create a GitHub Release with all artifacts
- Attach a BUILD-INFO.md file with installation instructions

## Git Tags Structure

Our Git tags for releases follow this structure:

- `user-app-v{version}`: Contains the source code at that version point and the built app artifacts
- `release-{version}`: Used to trigger the automated build process

## Installation

Please refer to the BUILD-INFO.md file in each release for platform-specific installation instructions.

## Troubleshooting

If you encounter issues during the build process:

1. Check that all prerequisites are installed
2. Verify that you have the necessary credentials for each platform
3. For iOS builds, ensure you have a valid Apple Developer account and certificates
4. For Android builds, verify your keystore configuration

For more detailed information, see the platform-specific documentation:
- iOS: [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- Android: [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- Desktop: [Electron Builder Documentation](https://www.electron.build/) 