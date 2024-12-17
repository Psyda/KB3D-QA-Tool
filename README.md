# 3D Asset QA Report Tool

A web-based tool for creating and managing quality assurance reports for 3D assets. Built with Next.js and React, this tool helps QA testers document issues, track asset quality, and generate professional PDF reports.

## Features

- **Structured QA Process**: Comprehensive checklist for geometry, UV, textures, and shaders
- **Issue Tracking**: Document issues with severity levels, tags, and detailed descriptions
- **Local Storage**: Reports are automatically saved in browser storage
- **Export Options**: 
  - Download reports as JSON for future editing
  - Generate professional PDF reports
- **Report Management**: Load and edit existing reports

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/qa-report-tool.git
cd qa-report-tool
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter tester name and pack name
2. Complete the QA checklist
3. Add issues as needed:
   - Specify object and material names
   - Set severity level
   - Add relevant tags
   - Provide detailed descriptions
4. Generate and download reports in JSON or PDF format

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [@react-pdf/renderer](https://react-pdf.org/) - PDF generation
- [Lucide React](https://lucide.dev/) - Icons

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
