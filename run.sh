#!/bin/bash

# Output report file
report_file="blog_publish_report.md"
echo "# Blog Publish Report" > "$report_file"
echo "_Generated on $(date)_" >> "$report_file"
echo "" >> "$report_file"

# First batch of topics
topics=(
    "benifits of indoor games"
    "best programming languages in 2024"
    "how to learn Bash Scipring"
)

echo "## First Batch" >> "$report_file"
echo "Starting first batch of ${#topics[@]} blogs..."

current_blog=1
for topic in "${topics[@]}"; do
    echo "Publishing blog $current_blog: '$topic'..."
    npx ts-node ./runGenerator.ts "$topic"

    if [ $? -eq 0 ]; then
        echo "[SUCCESS] Blog $current_blog published: '$topic'"
        echo "- ✅ **$topic**" >> "$report_file"
    else
        echo "[ERROR] Failed to publish blog $current_blog: '$topic'"
        echo "- ❌ **$topic**" >> "$report_file"
    fi

    ((current_blog++))
    echo "Sleeping 5 seconds before next blog..."
    sleep 5
    echo "----------------------"
done

# Second batch of topics
more_topics=(
    "how start outdoor games"
    "first new born bay"
)

echo "" >> "$report_file"
echo "## Second Batch" >> "$report_file"
echo "Starting second batch of ${#more_topics[@]} blogs..."

current_blog=1
for topic in "${more_topics[@]}"; do
    echo "Publishing blog $current_blog: '$topic'..."
    npx ts-node ./popular.ts "$topic"

    if [ $? -eq 0 ]; then
        echo "[SUCCESS] Blog $current_blog published: '$topic'"
        echo "- ✅ **$topic**" >> "$report_file"
    else
        echo "[ERROR] Failed to publish blog $current_blog: '$topic'"
        echo "- ❌ **$topic**" >> "$report_file"
    fi

    ((current_blog++))
    echo "Sleeping 5 seconds before next blog..."
    sleep 5
    echo "----------------------"
done

echo "" >> "$report_file"
echo "✅ All blog processes completed." | tee -a "$report_file"
echo "Report saved to: $report_file"
