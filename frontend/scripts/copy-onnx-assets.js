import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const backendModelsDir = path.join(rootDir, 'backend/models');
const frontendDir = path.join(rootDir, 'frontend');
const publicDir = path.join(frontendDir, 'public');
const destModelsDir = path.join(publicDir, 'models');
const destOrtDir = path.join(publicDir, 'ort');
const ortSourceDir = path.join(frontendDir, 'node_modules/onnxruntime-web/dist');

// Helper to ensure directory exists
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[ONNX Asset Sync] Created directory: ${dir}`);
    }
}

async function syncAssets() {
    console.log('[ONNX Asset Sync] Synchronizing ONNX and WebAssembly assets...');

    ensureDir(destModelsDir);
    ensureDir(destOrtDir);

    // 1. Copy Model files from backend/models/
    const filesToCopy = [
        {
            src: path.join(backendModelsDir, 'score_model_v2.onnx'),
            dest: path.join(destModelsDir, 'score_model_v2.onnx')
        },
        {
            src: path.join(backendModelsDir, 'role_model_v2.onnx'),
            dest: path.join(destModelsDir, 'role_model_v2.onnx')
        },
        {
            src: path.join(backendModelsDir, 'vocabulary_v2_list.json'),
            dest: path.join(destModelsDir, 'vocabulary_v2_list.json')
        }
    ];

    for (const item of filesToCopy) {
        if (fs.existsSync(item.src)) {
            fs.copyFileSync(item.src, item.dest);
            console.log(`[ONNX Asset Sync] Copied model: ${path.basename(item.src)} -> ${item.dest}`);
        } else {
            if (path.basename(item.src) === 'role_model_v2.onnx') {
                // role_model_v2.onnx is optional in onDevicePredictor
                console.log(`[ONNX Asset Sync] Optional model not found (skipping): ${path.basename(item.src)}`);
            } else {
                console.error(`[ONNX Asset Sync] Warning: Required source file missing: ${item.src}`);
            }
        }
    }

    // 2. Copy WebAssembly worker binaries from onnxruntime-web/dist/
    if (fs.existsSync(ortSourceDir)) {
        const ortFiles = fs.readdirSync(ortSourceDir);
        let copiedCount = 0;
        for (const file of ortFiles) {
            // We want ort-wasm* files (both .wasm and their loader .js/.mjs files)
            if (file.startsWith('ort-wasm')) {
                // Normalize some extensions so the dynamically imported module loader resolves them correctly
                // as requested by the env.wasm.wasmPaths in onDevicePredictor.ts
                const srcPath = path.join(ortSourceDir, file);
                
                // Copy original
                const destPath = path.join(destOrtDir, file);
                fs.copyFileSync(srcPath, destPath);
                
                // Also create .js alias if the filename ends in .mjs, since predictor handles them interchangeably
                if (file.endsWith('.mjs')) {
                    const jsFile = file.slice(0, -4) + '.js';
                    fs.copyFileSync(srcPath, path.join(destOrtDir, jsFile));
                }
                
                copiedCount++;
            }
        }
        console.log(`[ONNX Asset Sync] Copied ${copiedCount} ONNX WebAssembly support files to ${destOrtDir}`);
    } else {
        console.error(`[ONNX Asset Sync] Error: onnxruntime-web distribution folder not found at: ${ortSourceDir}`);
    }

    console.log('[ONNX Asset Sync] Synchronization complete!');
}

syncAssets().catch(err => {
    console.error('[ONNX Asset Sync] Synchronization failed:', err);
});
