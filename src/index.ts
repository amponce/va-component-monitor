/**
 * VA Component Monitor - Main Entry Point
 * 
 * This module provides both programmatic API access and MCP server functionality
 * for monitoring Department of Veterans Affairs component library usage.
 */

export { VAComponentMonitor } from './monitor/VAComponentMonitor';
export { ComponentAnalyzer } from './analyzer/ComponentAnalyzer';
export { AccessibilityValidator } from './validators/AccessibilityValidator';
export { DesignSystemChecker } from './validators/DesignSystemChecker';
export * from './types';

// Default export for convenience
export { VAComponentMonitor as default } from './monitor/VAComponentMonitor';
