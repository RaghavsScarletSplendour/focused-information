export const routes = {
  landing: '/',
  app: '/app',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
