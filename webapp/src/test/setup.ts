/**
 * Jest setup file for React Testing Library and global mocks
 */

import { configure } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import React from 'react';

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true,
});

// Mock Intersection Observer
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock navigator.clipboard
Object.defineProperty(window, 'navigator', {
  value: {
    ...navigator,
    clipboard: {
      writeText: jest.fn(),
      readText: jest.fn(),
    },
  },
});

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor(url: string, protocols?: string | string[]) {
    // Mock constructor
  }
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  close(code?: number, reason?: string): void {}
  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {}
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {}
  dispatchEvent(event: Event): boolean {
    return true;
  }
  readonly url: string = '';
  readonly readyState: number = WebSocket.CONNECTING;
  readonly bufferedAmount: number = 0;
  readonly onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  readonly onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  readonly onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  readonly onerror: ((this: WebSocket, ev: Event) => any) | null = null;
};

// Suppress console warnings in tests unless explicitly needed
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});

// Mock MUI components that might cause issues in tests
jest.mock('@mui/material', () => {
  return {
    Button: (props: any) => React.createElement('button', props, props.children),
    TextField: (props: any) => React.createElement('input', props),
    Select: (props: any) => React.createElement('select', props, props.children),
    MenuItem: (props: any) => React.createElement('option', props, props.children),
    Chip: (props: any) => React.createElement('div', props, props.children),
    Alert: (props: any) => React.createElement('div', props, props.children),
    Box: (props: any) => React.createElement('div', props, props.children),
    Grid: (props: any) => React.createElement('div', props, props.children),
    Paper: (props: any) => React.createElement('div', props, props.children),
    Table: (props: any) => React.createElement('table', props, props.children),
    TableHead: (props: any) => React.createElement('thead', props, props.children),
    TableBody: (props: any) => React.createElement('tbody', props, props.children),
    TableRow: (props: any) => React.createElement('tr', props, props.children),
    TableCell: (props: any) => React.createElement('td', props, props.children),
    Typography: (props: any) => React.createElement('span', props, props.children),
    useTheme: () => ({
      palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
      },
      spacing: (factor: number) => `${factor * 8}px`,
      breakpoints: {
        values: {
          xs: 0,
          sm: 600,
          md: 960,
          lg: 1280,
          xl: 1920,
        },
      },
    }),
    useMediaQuery: () => true,
  };
});

// Mock React Flow
const mockNodes: any[] = [];
const mockEdges: any[] = [];

jest.mock('reactflow', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Background: () => React.createElement('div', {}),
  Controls: () => React.createElement('div', {}),
  MiniMap: () => React.createElement('div', {}),
  addEdge: jest.fn(),
  useNodesState: () => [mockNodes, jest.fn()],
  useEdgesState: () => [mockEdges, jest.fn()],
}));

// Mock Chart.js components
jest.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Line: () => React.createElement('div', {}),
  XAxis: () => React.createElement('div', {}),
  YAxis: () => React.createElement('div', {}),
  CartesianGrid: () => React.createElement('div', {}),
  Tooltip: () => React.createElement('div', {}),
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  PieChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Pie: () => React.createElement('div', {}),
  Cell: () => React.createElement('div', {}),
  BarChart: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Bar: () => React.createElement('div', {}),
  Legend: () => React.createElement('div', {}),
}));

// Mock file system operations
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
}));

// Mock axios
jest.mock('axios');