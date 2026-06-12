import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const Projects = lazy(() => import('@/pages/Projects'));
const Studio = lazy(() => import('@/pages/Studio'));
const Library = lazy(() => import('@/pages/Library'));
const Publish = lazy(() => import('@/pages/Publish'));

export const appRoutes: RouteObject[] = [
  { index: true, element: <Projects /> },
  { path: 'projects', element: <Projects /> },
  { path: 'studio', element: <Studio /> },
  { path: 'library', element: <Library /> },
  { path: 'publish', element: <Publish /> },
];
