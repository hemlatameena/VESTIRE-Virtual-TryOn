# VESTIRE Phase 2 — IDM-VTON

This build removes OpenAI completely. Generate Look uses the official IDM-VTON Hugging Face Space through Gradio's JavaScript client.

## Requirements
- Node.js 18+
- Internet connection
- No OpenAI API key
- No OpenAI billing

## Start

```bash
npm install
npm start
```

Or double-click `start.bat`.

Then open http://localhost:3000

## Notes

The first generation can take time because the public IDM-VTON Space runs on shared ZeroGPU infrastructure. If the Space is busy, retry after a short wait.

IDM-VTON is the official virtual try-on implementation by Yisol. Its code and checkpoints are licensed CC BY-NC-SA 4.0, so review that license before using the model commercially.


## Latest UI upgrade
- Added an interactive Colour Match section at the top of the right-hand try-on panel.
- Customers can choose a base colour and click recommended pairing colours.
- The colour recommendations are local UI logic and do not require an AI API.
