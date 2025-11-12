# Network Hydraulic Frontend

Material-UI powered React SPA built with Vite to match the `docs/react_app_design.md` specification. It offers:

- Configuration upload form with validation and file dropzones.
- Results and history panes that reflect the solver run state.
- Pressure profile charts and a simplified React Flow topology preview.

## Technology Stack

- Vite + React 19 (TypeScript template)
- Material-UI (MUI 5) for layout and theming
- Zustand for lightweight state management
- React Hook Form + Yup for schema validation
- Chart.js (via `react-chartjs-2`) for pressure profiles
- React Flow for topology visualization
- React Dropzone for configuration file uploads
- Axios-powered service layer that now talks to the FastAPI backend

## Running Locally

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

By default the React app assumes the FastAPI server is reachable at `http://localhost:8000` (see the root README for how to start it). Use `npm run build` to create a production bundle and `npm run preview` to inspect it locally after building.

## Backend Integration

The API lives in `network_hydraulic.api.app` and exposes `POST /api/calculate`. Run the server while developing the UI:

```bash
pip install -e .[dev]
uvicorn network_hydraulic.api.app:app --reload --port 8000
```

When the backend is running, the frontend automatically sends the uploaded configuration text to the solver and renders the real response in the dashboard.

## Testing & Linting

The template ships with `npm run build` and `npm run lint`. Extend with Jest/Cypress as needed once backend integration is available.
