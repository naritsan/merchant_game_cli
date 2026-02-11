#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './app.js';

// 代替スクリーンバッファに切り替え（vim/htopと同じ）
process.stdout.write('\x1b[?1049h');
// 画面クリア + カーソルを左上に
process.stdout.write('\x1b[2J\x1b[H');

const { waitUntilExit } = render(<App />);

// 終了時に元のスクリーンバッファに復帰
waitUntilExit().then(() => {
    process.stdout.write('\x1b[?1049l');
});
