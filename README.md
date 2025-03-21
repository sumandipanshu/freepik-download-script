# Freepik Download Script

A Node.js tool written in TypeScript for downloading images from Freepik via their API. This script supports batch processing, concurrent downloads, multiple API keys with automatic switching upon reaching daily limits, and optional zipping of downloaded images.

## Features

- **Batch Processing:** Process a specific batch (with configurable batch size) or all resources.
- **Multiple API Keys:** Automatically switches API keys if a daily limit is reached.
- **Storage Options:** Download images as files (default) or store them in memory.
- **Zip Creation:** Optionally create a zip archive of the downloaded images.
- **Concurrency:** Supports concurrent downloads with a configurable limit.
- **Robust Logging:** Uses [Winston](https://github.com/winstonjs/winston) for structured logging.
- **Error Handling & Retries:** Built-in retry logic for transient network errors.

## Requirements

- Node.js (v12+)
- NPM

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/freepik-download-script.git
   cd freepik-download-script
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Compile TypeScript**

   ```bash
   npm run build
   ```

## Configuration

The API keys and resource IDs are stored in a separate configuration file (`src/config.ts`). **Do not modify** this file unless necessary. Ensure your configuration file is set up correctly.

## Usage

Run the compiled JavaScript from the `dist` folder:

```bash
node dist/main.js [options]
```

### Options

- `--batch=<number>`: Process a specific batch (default batch size is 50).
- `--all`: Process all resources.
- `--batch-size=<number>`: Specify the number of resources per batch (default: 50).
- `--skip-zip`: Skip zip creation.
- `--force-zip`: Force zip creation even if a daily limit is encountered (overrides `--skip-zip`).
- `--store=<mode>`: Storage mode; either `file` (default) or `memory`.
- `--keep-images`: Do not delete the images folder after zipping (only applicable for file storage).

### Examples

- **Process Batch 1 (50 resources) with default settings:**

  ```bash
  node dist/main.js --batch=1
  ```

- **Process All Resources, Store in Memory, and Skip Zip Creation:**

  ```bash
  node dist/main.js --all --store=memory --skip-zip
  ```

- **Process Batch 2 with a Custom Batch Size of 30 and Force Zip Creation:**

  ```bash
  node dist/main.js --batch=2 --batch-size=30 --force-zip
  ```

- **Process Batch 1 and Keep the Images Folder After Zipping:**

  ```bash
  node dist/main.js --batch=1 --keep-images
  ```

## Development

### Build

Compile the TypeScript code:

```bash
npm run build
```

### Run in Development Mode

You can run the TypeScript code directly using `ts-node`:

```bash
npm run dev -- [options]
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
