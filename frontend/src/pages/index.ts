import { lazy } from 'react';

export const LandingPage = lazy(() => import('@/pages/Landing'));
export const ProjectsPage = lazy(() => import('@/pages/Projects'));
export const StudioPage = lazy(() => import('@/pages/Studio'));
export const LibraryPage = lazy(() => import('@/pages/Library'));
export const PublishPage = lazy(() => import('@/pages/Publish'));
export const NotFoundPage = lazy(() => import('@/pages/NotFound'));
