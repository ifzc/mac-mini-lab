#!/bin/bash
set -e
cd -- "$(dirname -- "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo '请先安装 Node.js 22.13 或更新版本，然后重新打开本文件。'
  read -r -p '按回车关闭…'
  exit 1
fi
if [ ! -d node_modules ]; then
  npm ci
fi
if curl --silent --fail --max-time 2 http://localhost:4317/ >/dev/null 2>&1; then
  open 'http://localhost:4317/'
  exit 0
fi
printf '\nMac mini 3D 探索台\n启动后请打开 http://localhost:4317/\n保持此窗口开启。按 Control+C 停止。\n\n'
(sleep 4; open 'http://localhost:4317/') &
npm run dev -- --port 4317
