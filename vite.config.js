
import { defineConfig } from 'vite';
import laravel, { refreshPaths } from 'laravel-vite-plugin';

import fs from 'fs-extra';
import path from 'path';

const folder = {
    src: "resources/", // source files
    src_assets: "resources/", // source assets files
    dist: "public/", // build files
    dist_assets: "public/build/" //build assets files
};

export default defineConfig({
    build: {
        manifest: true,
        rtl: true,
        outDir: 'public/build/',
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                assetFileNames: (css) => {
                    if (css.name.split('.').pop() == 'css') {
                        return 'css/' + `[name]` + '.min.' + 'css';
                    } else {
                        return 'icons/' + css.name;
                    }
                },
                entryFileNames: 'js/' + `[name]` + `.js`,
            },
        },
    },
    plugins: [
        laravel(
            {
                input: [
                    'resources/scss/bootstrap.scss',
                    'resources/scss/icons.scss',
                    'resources/scss/app.scss',
                    'resources/scss/custom.scss',
                ],
                refresh: [
                    ...refreshPaths,
                    'resources/views/**',
                ],
            }
        ),
        {
            name: 'copy-specific-packages',
            async writeBundle() {

                try {
                    // Copy images, json, fonts, and js
                    await Promise.all([
                        fs.copy(folder.src_assets + 'fonts', folder.dist_assets + 'fonts'),
                        fs.copy(folder.src_assets + 'images', folder.dist_assets + 'images'),
                        fs.copy(folder.src_assets + 'js', folder.dist_assets + 'js'),
                        fs.copy(folder.src_assets + 'json', folder.dist_assets + 'json'),
                    ]);
                } catch (error) {
                    console.error('Error copying assets:', error);
                }

                const outputPath = path.resolve(__dirname, folder.dist_assets); // Adjust the destination path
                const configPath = path.resolve(__dirname, 'package-copy-config.json');

                try {
                    const configContent = await fs.readFile(configPath, 'utf-8');
                    const { packagesToCopy } = JSON.parse(configContent);

                    for (const packageName of packagesToCopy) {
                        const destPackagePath = path.join(outputPath, 'libs', packageName);

                        const sourcePath = (fs.existsSync(path.join(__dirname, 'node_modules', packageName + "/dist"))) ?
                            path.join(__dirname, 'node_modules', packageName + "/dist")
                            : path.join(__dirname, 'node_modules', packageName);

                        try {
                            await fs.access(sourcePath, fs.constants.F_OK);
                            await fs.copy(sourcePath, destPackagePath);
                        } catch (error) {
                            console.error(`Package ${packageName} does not exist.`);
                        }
                    }
                } catch (error) {
                    console.error('Error copying and renaming packages:', error);
                }
            },
        },

    ],
});

