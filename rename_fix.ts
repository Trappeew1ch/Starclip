import fs from 'fs';
import path from 'path';

const dir = 'public/images';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.includes('StarClip') && file.endsWith('.png') && !file.includes('StarClip страница')) {
        console.log('Found:', file);
        if (file !== 'starclip-code.png') {
            fs.renameSync(path.join(dir, file), path.join(dir, 'starclip-code.png'));
            console.log('Renamed to starclip-code.png');
        }
    }
});
