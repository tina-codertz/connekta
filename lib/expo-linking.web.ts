// Mock expo-linking for web environments
// This module provides a no-op implementation for web platforms

export default {
  addEventListener: () => ({
    remove: () => {},
  }),
  removeEventListener: () => {},
  createURL: (path) => path,
  getInitialURL: async () => null,
  openURL: async (url) => true,
  canOpenURL: async () => true,
  getState: () => null,
  parse: (url) => ({}),
};

export const addEventListener = () => ({
  remove: () => {},
});

export const removeEventListener = () => {};
export const createURL = (path) => path;
export const getInitialURL = async () => null;
export const openURL = async (url) => true;
export const canOpenURL = async () => true;
export const getState = () => null;
export const parse = (url) => ({});
