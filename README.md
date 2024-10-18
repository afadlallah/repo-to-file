# Repo to File

Next.js application that allows you to convert a GitHub repository into a single text file, making it easier to use as context for LLMs.

## Features

- Convert any public GitHub repository to a single text file
- Exclude specific file types to customize the output
- Copy the converted content to clipboard
- Download the converted content as a text file
- Syntax highlighting for better readability

## Getting Started

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/afadlallah/repo-to-file.git
   cd repo-to-file
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Copy the `.env.example` file to `.env.local` in the root directory and add your GitHub access token:
   ```
   cp .env.example .env.local
   ```
   Then edit the `.env.local` file and replace the placeholder with your actual GitHub access token:
   ```
   GITHUB_ACCESS_TOKEN=your_github_access_token_here
   ```

4. Start the development server:
   ```
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

### Usage

1. Enter the URL of the GitHub repository you want to convert.

2. Click the "Convert Repo" button.

3. Once the conversion is complete, you can copy the content to your clipboard or download it as a text file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
