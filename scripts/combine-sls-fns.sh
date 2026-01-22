#!/bin/bash

stages="dev prod"

for stage in $stages; do
  # Output file
  output="serverless/functions/_dist/index-$stage.yml"

  # Clear existing file
  > "$output"

  # Always add common file
  if [ -f "serverless/functions/base.yml" ]; then
    cat "serverless/functions/base.yml" >> "$output"
    echo "" >> "$output"
  fi
  
  # Add stage-specific file if it exists
  if [ -f "serverless/functions/stage-$stage.yml" ]; then
    cat "serverless/functions/stage-$stage.yml" >> "$output"
  fi
  
  echo "Generated: $output"
done

echo "✅ Updated functions files"