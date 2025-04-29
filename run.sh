#!/bin/bash

# Array of blog topics
topics=(
  "benefits of indoor games"
  "best programming languages in 2024"
  "how to learn bash scripting"
  "healthy habits for developers"
)

# Total number of blogs
total_blogs=${#topics[@]}
current_blog=1

echo "Starting batch publishing of $total_blogs blogs..."

# Loop through each topic
for topic in "${topics[@]}"; do
  echo "Publishing blog $current_blog/$total_blogs: '$topic'..."
  
  # Run the TypeScript file with the current topic
  npx ts-node ./runGenerator.ts "$topic"
  
  # Check if the command succeeded
  if [ $? -eq 0 ]; then
    echo "[SUCCESS] Blog $current_blog published: '$topic'"
  else
    echo "[ERROR] Failed to publish blog $current_blog: '$topic'"
  fi
  
  ((current_blog++)) # Increment counter
  echo "----------------------------------------"
done

echo "All blogs processed!"
