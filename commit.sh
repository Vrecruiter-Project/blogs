#!/bin/bash

# Exit on any error
set -e

# Generate timestamp-based commit message
commit_message="Auto-commit: $(date '+%Y-%m-%d %H:%M')"

# Add all changes
git add .

# Commit with auto message
git commit -m "$commit_message"

# Push to current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
git push origin "$current_branch"
