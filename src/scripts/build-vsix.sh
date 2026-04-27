#!/bin/bash
set -e

# Read version and distilled from package.json
VERSION=$(node -p "require('./package.json').version")
DISTILLED=$(node -p "require('./package.json').distilled")

# Create bin directory if it doesn't exist
mkdir -p ../bin

# Generate VSIX with custom filename including both version numbers
vsce package --no-dependencies --out ../bin/roo-cline-${VERSION}-distilled-${DISTILLED}.vsix
