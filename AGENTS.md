# AGENT Guidelines for F1-Stats Frontend Repository

This document outlines the essential commands and code style guidelines for agents operating within the `f1-stats/frontend/f1-stats` repository. Adhering to these guidelines ensures consistency, maintainability, and high code quality.

## 1. Build, Lint, and Test Commands

This project is a React application built with Vite.

### Build
*   **Full Build**: `npm run build`
    *   This command compiles the project for production.

### Linting
*   **Lint All Files**: `npm run lint`
    *   This command runs ESLint across the entire codebase to identify and report code style and quality issues.

### Testing
*   **Run All Tests**: `npm test` or `vitest`
    *   While not explicitly defined in `package.json`, `npm test` is a common alias, and `vitest` is a prevalent testing framework in Vite projects. Agents should attempt `npm test` first, and if that fails or is not found, try `npx vitest`.
*   **Run a Single Test File**: `npx vitest <path/to/test/file.js|ts|jsx|tsx>`
    *   Replace `<path/to/test/file.js|ts|jsx|tsx>` with the relative or absolute path to the specific test file you wish to run.
    *   Example: `npx vitest src/components/MyComponent.test.jsx`

## 2. Code Style Guidelines

Given the absence of explicit configuration files (e.g., `.eslintrc`, `prettierrc`, `tsconfig.json`), the following guidelines are based on common best practices for React, TypeScript, and JavaScript projects, and inferred from the presence of `eslint` in `package.json`.

### 2.1. Imports
*   **Order**:
    1.  External library imports (e.g., `react`, `@fortawesome/*`)
    2.  Absolute imports (e.g., `components/Button`)
    3.  Relative imports (e.g., `./utils`, `../hooks`)
*   **Grouping**: Group imports by type and leave a blank line between groups.
*   **Alphabetical Sorting**: Within each group, sort imports alphabetically.
*   **Destructuring**: Prefer destructuring for named imports.

    ```javascript
    import React from 'react';
    import { useParams } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { fetchData } from '../api';
    ```

### 2.2. Formatting
*   **Indentation**: Use 2 spaces for indentation.
*   **Semicolons**: Use semicolons at the end of statements.
*   **Quotes**: Use single quotes for strings, unless the string contains a single quote.
*   **Trailing Commas**: Use trailing commas for multi-line arrays and objects.
*   **Braces**: Use K&R style for braces (opening brace on the same line).

### 2.3. Types (TypeScript)
*   **Explicit Typing**: Strongly type all function parameters, return values, and state variables.
*   **Interfaces/Types**: Use interfaces for object shapes and types for utility types or unions.
*   **Props**: Define component props using interfaces or types.
*   **Generics**: Use generics for reusable components and functions.

### 2.4. Naming Conventions
*   **Components**: PascalCase (e.g., `MyComponent`, `UserProfile`).
*   **Variables**: camelCase (e.g., `userName`, `totalCount`).
*   **Functions**: camelCase (e.g., `calculateTotal`, `fetchUserData`).
*   **Constants**: SCREAMING_SNAKE_CASE for global constants (e.g., `API_BASE_URL`, `MAX_RETRIES`).
*   **Files**: kebab-case for component files (e.g., `my-component.tsx`), camelCase for utility files (e.g., `apiUtils.ts`).

### 2.5. Error Handling
*   **Asynchronous Operations**: Use `try-catch` blocks for all asynchronous operations (e.g., `fetch` calls, `axios` requests) to handle potential errors gracefully.
*   **User Feedback**: Provide clear and informative error messages to the user.
*   **Logging**: Log errors to the console or a logging service for debugging.

### 2.6. Component Structure and Best Practices
*   **Functional Components**: Prefer functional components with React Hooks over class components.
*   **Prop Destructuring**: Destructure props directly in the function signature for readability.
*   **State Management**: Use `useState` and `useReducer` for local component state. Consider context API or a state management library (like Redux, Zustand, Jotai, if already in use or explicitly introduced) for global state.
*   **Side Effects**: Manage side effects using the `useEffect` hook. Ensure proper dependency arrays to prevent unnecessary re-renders or infinite loops.
*   **Accessibility**: Always consider accessibility (ARIA attributes, semantic HTML) when building UI components.
*   **Modularity**: Break down large components into smaller, reusable, and focused components.

### 2.7. CSS/Styling
*   Given the `tailwind-merge` and `tailwindcss` dependencies, anticipate the use of Tailwind CSS for styling. Agents should leverage Tailwind CSS classes for styling whenever possible.

## 3. Cursor/Copilot Rules

No specific Cursor or Copilot rule files were found in `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md`. Agents should adhere strictly to the above general code style guidelines.