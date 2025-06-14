# Chat Bot Frontend

A React.js frontend application built with Vite and TypeScript for the Chat Bot project.

## Features

- Modern chat interface with real-time messaging
- TypeScript for type safety
- Responsive design
- Message history display
- Loading states and error handling
- Clean and intuitive UI

## Tech Stack

- React 19
- TypeScript
- Vite
- Axios for API communication
- CSS3 for styling

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend communicates with the backend API running on `http://localhost:3000`. Make sure your backend server is running before using the chat interface.

## Project Structure

```
src/
├── components/     # React components (future)
├── services/       # API service functions
├── App.tsx         # Main application component
├── App.css         # Application styles
├── main.tsx        # Application entry point
└── index.css       # Global styles
```
