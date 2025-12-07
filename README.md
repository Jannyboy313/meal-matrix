# Meal Matrix
> [!WARNING]
> This is a hobby project built as an experiment with **heavy** AI-assisted development using GitHub Copilot and Claude. While functional, it's primarily for learning and exploration rather than a demonstration of production-ready practices.

A Progressive Web App for recipe management built with SvelteKit.

## 🚀 Features

- **Recipe Management**: Create, edit, and organize your recipes with ease
- **Progressive Web App**: Works offline and can be installed on any device
- **Modern UI**: Built with Skeleton UI and Tailwind CSS for a beautiful, responsive interface
- **TypeScript**: Fully typed for better developer experience and code quality

## 🛠️ Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) with [Svelte 5](https://svelte.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Skeleton UI](https://www.skeleton.dev/)
- **Package Manager**: Yarn

## 📋 Prerequisites

- Node.js >= 20.0.0
- Yarn >= 4.0.0

## 🏁 Getting Started

1. **Clone the repository**

```sh
git clone https://github.com/Jannyboy313/meal-matrix.git
cd meal-matrix
```

2. **Install dependencies**

```sh
yarn install
```

3. **Start the development server**

```sh
yarn dev

# or start the server and open the app in a new browser tab
yarn dev --open
```

The app will be available at `http://localhost:5173`

## 🔨 Development

### Available Scripts

- `yarn dev` - Start the development server
- `yarn build` - Create a production build
- `yarn preview` - Preview the production build
- `yarn check` - Run type checking with svelte-check
- `yarn check:watch` - Run type checking in watch mode

### Project Structure

```
meal-matrix/
├── src/
│   ├── lib/
│   │   ├── components/     # Reusable UI components
│   │   ├── assets/         # Static assets
│   │   └── types.ts        # TypeScript type definitions
│   └── routes/             # SvelteKit routes
│       ├── recipes/        # Recipe-related pages
│       └── +layout.svelte  # Root layout
├── static/                 # Static files
└── package.json
```

## 🚢 Building for Production

To create a production version of your app:

```sh
yarn build
```

You can preview the production build with:

```sh
yarn preview
```

The app uses [@sveltejs/adapter-node](https://kit.svelte.dev/docs/adapter-node) for deployment to Node.js environments.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Jan van Overbeek**
- GitHub: [@jannyboy313](https://github.com/jannyboy313)
- Email: janvanoverbeek12@gmail.com

## 🐛 Issues

Found a bug? Please report it on the [issues page](https://github.com/Jannyboy313/meal-matrix/issues).
