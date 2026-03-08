# add_path_comments.py
import os

# Configuration: file extensions and their comment prefixes
COMMENT_CONFIG = {
    '.ts': '// ',
    '.tsx': '// ',
    '.js': '// ',
    '.jsx': '// ',
    '.css': '// ',
    '.scss': '// ',
    '.less': '// ',
    '.postcss': '// ',
    '.html': '<!-- ',
    '.svg': '<!-- ',
    '.md': '<!-- ',
    '.yaml': '# ',
    '.yml': '# ',
    '.sh': '# ',
    '.py': '# ',
}

# Suffix for comments that need a closing tag (like <!-- -->)
SUFFIX_CONFIG = {
    '.html': ' -->',
    '.svg': ' -->',
    '.md': ' -->',
}

# Directories to ignore
IGNORE_DIRS = {
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.vscode',
    '.idea',
}

# Files to ignore specifically
IGNORE_FILES = {
    'package-lock.json',
}

def process_files(root_dir):
    for root, dirs, files in os.walk(root_dir):
        # Filter out ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file in IGNORE_FILES:
                continue
                
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, root_dir)
            
            # Normalize path for the comment (always use forward slashes)
            normalized_path = rel_path.replace(os.sep, '/')
            
            ext = os.path.splitext(file)[1].lower()
            
            if ext in COMMENT_CONFIG:
                prefix = COMMENT_CONFIG[ext]
                suffix = SUFFIX_CONFIG.get(ext, '')
                comment_line = f"{prefix}{normalized_path}{suffix}\n"
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Skip if the file already starts with the correct comment
                    if content.startswith(comment_line):
                        print(f"Skipping (already exists): {normalized_path}")
                        continue
                        
                    # Add the comment line at the top
                    new_content = comment_line + content
                    
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Added comment to: {normalized_path}")
                except Exception as e:
                    print(f"Error processing {normalized_path}: {e}")

if __name__ == "__main__":
    project_root = "/Users/akilaranasinghe/Documents/GitHub/APEX2"
    process_files(project_root)
