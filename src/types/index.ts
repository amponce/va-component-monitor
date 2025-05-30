/**
 * Type definitions for VA Component Monitor
 */

export interface VAComponentUsage {
  componentName: string;
  filePath: string;
  lineNumber: number;
  props: Record<string, any>;
  isCompliant: boolean;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  type: 'accessibility' | 'design-system' | 'performance' | 'best-practice';
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  rule: string;
}

export interface ScanResult {
  projectPath: string;
  scannedFiles: string[];
  components: VAComponentUsage[];
  summary: {
    totalComponents: number;
    compliantComponents: number;
    issuesFound: number;
    coveragePercentage: number;
  };
  timestamp: string;
}

export interface ComplianceReport {
  overview: {
    projectName: string;
    scanDate: string;
    totalFiles: number;
    totalComponents: number;
    complianceScore: number;
  };
  components: VAComponentUsage[];
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface MonitorConfig {
  verbose?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  accessibilityRules?: string[];
  designSystemVersion?: string;
}
