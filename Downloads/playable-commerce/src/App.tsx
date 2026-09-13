import { lazy, Suspense } from 'react';
import { LoaderCircle } from 'lucide-react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';

const Dashboard = lazy(() => import('./views/Dashboard'));
const ConnectStore = lazy(() => import('./views/ConnectStore'));
const CreateExperience = lazy(() => import('./views/CreateExperience'));
const AnalyzeStore = lazy(() => import('./views/AnalyzeStore'));
const SelectConcept = lazy(() => import('./views/SelectConcept'));
const Editor = lazy(() => import('./views/Editor'));
const Targeting = lazy(() => import('./views/Targeting'));
const Pricing = lazy(() => import('./views/Pricing'));

function RouteLoader() {
  return <div className="flex min-h-[50vh] items-center justify-center" role="status"><LoaderCircle className="mr-3 size-5 animate-spin text-blue-600 motion-reduce:animate-none" aria-hidden="true" /><span className="text-sm font-semibold text-neutral-600">Loading view…</span></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="create" element={<CreateExperience />} />
            <Route path="connect" element={<ConnectStore />} />
            <Route path="analyze" element={<AnalyzeStore />} />
            <Route path="concepts" element={<SelectConcept />} />
            <Route path="editor" element={<Editor />} />
            <Route path="targeting" element={<Targeting />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
