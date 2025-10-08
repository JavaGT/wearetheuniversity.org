#!/usr/bin/env node
import { promises as fsp } from 'fs';
import { join } from 'path';

// Progress tracking utility
const progress = {
  start: (message) => {
    console.log(`\n🚀 ${message}`);
    console.log('─'.repeat(50));
  },
  
  step: (current, total, message) => {
    const percentage = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total}) ${message}`);
  },
  
  complete: (stats) => {
    console.log('\n');
    console.log('─'.repeat(50));
    console.log('✅ Process Complete');
    console.log(`📊 Total files processed: ${stats.processed}`);
    console.log(`📝 Files modified: ${stats.modified}`);
    console.log(`⏱️  Processing time: ${stats.duration}ms`);
    if (stats.errors > 0) {
      console.log(`❌ Errors encountered: ${stats.errors}`);
    }
    console.log('─'.repeat(50));
  },
  
  error: (message) => console.error(`❌ ${message}`),
  warn: (message) => console.warn(`⚠️  ${message}`),
  success: (message) => console.log(`✅ ${message}`)
};

// Recursively find all .md files in a directory
async function findAllMarkdownFiles(dir) {
  let results = [];
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(await findAllMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        re        #!/usr/bin/env node
        import { promises as fsp } from 'fs';
        import { join } from 'path';
        
        // Progress tracking utility
        const progress = {
          start: (message) => {
            console.log(`\n🚀 ${message}`);
            console.log('─'.repeat(50));
          },
          
          step: (current, total, message) => {
            const percentage = Math.round((current / total) * 100);
            const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
            process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total}) ${message}`);
          },
          
          complete: (stats) => {
            console.log('\n');
            console.log('─'.repeat(50));
            console.log('✅ Process Complete');
            console.log(`📊 Total files processed: ${stats.processed}`);
            console.log(`📝 Files modified: ${stats.modified}`);
            console.log(`⏱️  Processing time: ${stats.duration}ms`);
            if (stats.errors > 0) {
              console.log(`❌ Errors encountered: ${stats.errors}`);
            }
            console.log('─'.repeat(50));
          },
          
          error: (message) => console.error(`❌ ${message}`),
          warn: (message) => console.warn(`⚠️  ${message}`),
          success: (message) => console.log(`✅ ${message}`)
        };
        
        // Recursively find all .md files in a directory
        async function findAllMarkdownFiles(dir) {
          let results = [];
          try {
            const entries = await fsp.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = join(dir, entry.name);
              if (entry.isDirectory()) {
                results = results.concat(await findAllMarkdownFiles(fullPath));
              } else if (entry.isFile() && entry.name.endsWith('.md')) {
                results.push(fullPath);
              }
            }
          } catch (e) { 
            progress.warn(`Cannot read directory: ${dir}`);
          }
          return results;
        }
        
        // Ensure layout: layout.njk in frontmatter
        async function ensureLayoutInMarkdown(mdPath) {
          try {
            let mdContent = await fsp.readFile(mdPath, 'utf8');
            
            if (/^---[\s\S]*---/.test(mdContent)) {
              // Has frontmatter, but check for layout
              if (!/^---[\s\S]*layout:\s*layout\.njk/m.test(mdContent)) {
                mdContent = mdContent.replace(/^(---[\s\S]*?)\n(---)/m, (m, p1, p2) => `${p1}\nlayout: layout.njk\n${p2}`);
                await fsp.writeFile(mdPath, mdContent, 'utf8');
                return { modified: true, error: false };
              }
              return { modified: false, error: false };
            } else {
              // No frontmatter, add it
              mdContent = `---\nlayout: layout.njk\n---\n` + mdContent;
              await fsp.writeFile(mdPath, mdContent, 'utf8');
              return { modified: true, error: false };
            }
          } catch (error) {
            progress.error(`Failed to process ${mdPath}: ${error.message}`);
            return { modified: false, error: true };
          }
        }
        
        async function main() {
          const startTime = Date.now();
          progress.start('Ensuring layout in Markdown files');
          
          const dirs = [
            join(process.cwd(), 'source', 'archive'),
            join(process.cwd(), 'source', 'blog')
          ];
          
          // Discovery phase
          console.log('🔍 Discovering Markdown files...');
          let allFiles = [];
          for (const dir of dirs) {
            const files = await findAllMarkdownFiles(dir);
            allFiles = allFiles.concat(files);
            console.log(`   Found ${files.length} files in ${dir.split('/').pop()}/`);
          }
          
          if (allFiles.length === 0) {
            console.log('ℹ️  No Markdown files found');
            return;
          }
          
          console.log(`\n📋 Processing ${allFiles.length} files total\n`);
          
          // Processing phase
          let stats = { processed: 0, modified: 0, errors: 0 };
          
          for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i];
            const filename = file.split('/').pop();
            
            progress.step(i + 1, allFiles.length, `Processing ${filename}`);
            
            const result = await ensureLayoutInMarkdown(file);
            stats.processed++;
            if (result.modified) stats.modified++;
            if (result.error) stats.errors++;
          }
          
          stats.duration = Date.now() - startTime;
          progress.complete(stats);
        }
        
        main().catch(error => {
          progress.error(`Script failed: ${error.message}`);
          process.exit(1);
        });sults.push(fullPath);
      }
    }
  } catch (e) { 
    progress.warn(`Cannot read directory: ${dir}`);
  }
  return results;
}

// Ensure layout: layout.njk in frontmatter
async function ensureLayoutInMarkdown(mdPath) {
  try {
    let mdContent = await fsp.readFile(mdPath, 'utf8');
    
    if (/^---[\s\S]*---/.test(mdContent)) {
      // Has frontmatter, but check for layout
      if (!/^---[\s\S]*layout:\s*layout\.njk/m.test(mdContent)) {
        mdContent = mdContent.replace(/^(---[\s\S]*?)\n(---)/m, (m, p1, p2) => `${p1}\nlayout: layout.njk\n${p2}`);
        await fsp.writeFile(mdPath, mdContent, 'utf8');
        return { modified: true, error: false };
      }
      return { modified: false, error: false };
    } else {
      // No frontmatter, add it
      mdContent = `---\nlayout: layout.njk\n---\n` + mdContent;
      await fsp.writeFile(mdPath, mdContent, 'utf8');
      return { modified: true, error: false };
    }
  } catch (error) {
    progress.error(`Failed to process ${mdPath}: ${error.message}`);
    return { modified: false, error: true };
  }
}

async function main() {
  const startTime = Date.now();
  progress.start('Ensuring layout in Markdown files');
  
  const dirs = [
    join(process.cwd(), 'source', 'archive'),
    join(process.cwd(), 'source', 'blog')
  ];
  
  // Discovery phase
  console.log('🔍 Discovering Markdown files...');
  let allFiles = [];
  for (const dir of dirs) {
    const files = await findAllMarkdownFiles(dir);
    allFiles = allFiles.concat(files);
    console.log(`   Found ${files.length} files in ${dir.split('/').pop()}/`);
  }
  
  if (allFiles.length === 0) {
    console.log('ℹ️  No Markdown files found');
    return;
  }
  
  console.log(`\n📋 Processing ${allFiles.length} files total\n`);
  
  // Processing phase
  let stats = { processed: 0, modified: 0, errors: 0 };
  
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const filename = file.split('/').pop();
    
    progress.step(i + 1, allFiles.length, `Processing ${filename}`);
    
    const result = await ensureLayoutInMarkdown(file);
    stats.processed++;
    if (result.modified) stats.modified++;
    if (result.error) stats.errors++;
  }
  
  stats.duration = Date.now() - startTime;
  progress.complete(stats);
}

main().catch(error => {
  progress.error(`Script failed: ${error.message}`);
  process.exit(1);
});
