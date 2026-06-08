// Mock expo-linking for web environments
// This module provides a no-op implementation for web platforms

type LinkingListener = { remove: () => void };

const noopListener = (): LinkingListener => ({
  remove: () => {},
});

export default {
  addEventListener: noopListener,
  removeEventListener: () => {},
  createURL: (path: string) => path,
  getInitialURL: async () => null as string | null,
  openURL: async (_url: string) => true,
  canOpenURL: async () => true,
  getState: () => null,
  parse: (_url: string) => ({}),
};

export const addEventListener = noopListener;
export const removeEventListener = () => {};
export const createURL = (path: string) => path;
export const getInitialURL = async () => null as string | null;
export const openURL = async (_url: string) => true;
export const canOpenURL = async () => true;
export const getState = () => null;
export const parse = (_url: string) => ({});
