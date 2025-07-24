#!/bin/bash

# Script to update headers in all SQL files under dbo/
# Author: Quyen Nguyen Duc

DIR="/Users/quyennguyen/Documents/campust/dbo"

for file in "$DIR"/*.sql; do
    filename=$(basename "$file")
    
    # Remove existing header block if present (from /*--- to ---*/)
    temp=$(mktemp)
    awk 'BEGIN{inHeader=0}
        /\/\*-+/ {inHeader=1; next}
        /--+\*\// && inHeader==1 {inHeader=0; next}
        inHeader==0 {print}' "$file" > "$temp"
    
    # Create new file with updated header
    newf=$(mktemp)
    cat > "$newf" << EOF
/*-----------------------------------------------------------------
* File: $filename
* Author: Quyen Nguyen Duc
* Date: 2025-07-24
* Description: This file is a component/module for the student application.
* Apache 2.0 License - Copyright 2025 Quyen Nguyen Duc
-----------------------------------------------------------------*/
EOF
    cat "$temp" >> "$newf"
    mv "$newf" "$file"
    rm "$temp"
    echo "Updated header in $filename"
done

echo "All SQL files in dbo/ have been updated with the new header." 