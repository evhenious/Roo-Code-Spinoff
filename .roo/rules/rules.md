# Code Quality Rules

1. Lint Rules:

   - Never disable any lint rules without explicit user approval

2. Styling Guidelines:
   - Use Tailwind CSS classes instead of inline style objects for new markup
   - VSCode CSS variables must be added to webview-ui/src/index.css before using them in Tailwind classes
   - Example: `<div className="text-md text-vscode-descriptionForeground mb-2" />` instead of style objects
