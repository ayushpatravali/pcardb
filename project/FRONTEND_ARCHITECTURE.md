# PCARDB Loan Automation - Frontend Architecture

## 1. Tech Stack Overview
- **Framework:** React 18 + Vite (Extremely fast HMR and optimized builds)
- **Styling:** Tailwind CSS (Utility-first framework replacing plain CSS)
- **State Management:** React Hook Form (Efficient form validation and state)
- **Routing:** React Router DOM (Client-side routing)

## 2. Directory Structure
```text
frontend/
├── index.html              # Entry HTML
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind theme and plugin definitions
└── src/
    ├── main.jsx            # React root mount
    ├── App.jsx             # Main App component & routing setup
    ├── index.css           # Global Tailwind directives
    ├── components/         # Reusable UI elements (InputField, SelectField, Alert)
    └── pages/
        ├── Dashboard.jsx   # Data table of all submitted applications
        └── NewApplication.jsx # The core multi-step dynamic loan form
```

## 3. The `NewApplication.jsx` Form Engine

This is the most critical component of the frontend. It is a massive, dynamic form that adapts based on the selected Loan Scheme.

### Dynamic Rendering
- **State:** `currentScheme` tracks whether the user is applying for `TRACTOR`, `SHEEP`, `BULLOCK`, or `LAND_DEV`.
- **Conditional UI:** The form renders specific nested detail sections based on `currentScheme`. For example, selecting "Tractor" reveals inputs for "Quotation Amount" and "Down Payment", while hiding "Number of Sheep".

### Payload Serialization
Because the backend expects specific Pydantic models, `NewApplication.jsx` strictly formats the payload before `POST`ing to `/applications/`:
- **Nested Objects:** Fields specific to a scheme are bundled into their respective JSON objects (e.g., `tractor_details`, `sheep_details`).
- **Stringified Arrays:** Complex arrays like `land_parcels` and `co_applicants` are processed using `JSON.stringify()` before submission to prevent `422 Unprocessable Entity` errors on the backend.

### CSS Resilience
To prevent text from accidentally turning invisible (e.g., due to Dark Mode browser extensions or inheritance bugs), all critical `InputField` and `SelectField` components in `src/components/` enforce explicit text colors (e.g., `text-gray-900`) alongside their background colors.

## 4. Build & Production Notes
During development, we use `vite preview` to serve a production build of the frontend. 
- **CRITICAL REMINDER:** If you make changes to `.jsx` files, you **MUST** run `npm run build` in the `frontend/` directory before `vite preview` will reflect them. `vite preview` serves the static `/dist` folder, it does *not* hot-reload raw source code like `npm run dev` does.
