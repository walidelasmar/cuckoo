# Cuckoo 🍳

Cuckoo is a restaurant management app for tracking recipes and raw materials, built with Next.js, TypeScript, Firebase, and Genkit AI.

## Features

- **Recipes** — Create, edit and manage your dish recipes with ingredient cost tracking
- - **Materials** — Manage your raw materials inventory with allergen info and provider details
  - - **AI Assistant** — Unit conversion powered by Genkit AI
    - - **Economics** — Cost breakdown analysis per recipe
     
      - ## Project Structure
     
      - ```
        src/
        ├── ai/                        # Genkit AI flows and configuration
        ├── app/                       # Next.js App Router pages
        │   ├── (dashboard)/           # Dashboard routes (recipes, materials)
        │   └── (auth)/                # Auth routes (signup)
        ├── components/
        │   ├── ui/                    # shadcn/ui primitives
        │   ├── layout/                # App-level layout (sidebar, logo)
        │   ├── materials/             # Materials feature components
        │   └── recipes/               # Recipes feature components
        ├── hooks/                     # Custom React hooks
        └── lib/
            ├── images/                # Placeholder image data
            ├── types.ts               # Shared TypeScript types
            ├── constants.ts           # App-wide constants
            └── data.ts                # Static data
        ```

        ## Getting Started

        To get started, take a look at `src/app/page.tsx`.
        
