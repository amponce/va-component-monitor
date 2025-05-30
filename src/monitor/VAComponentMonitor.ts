/**
 * Main VA Component Monitor class
 */

import { MonitorConfig, ScanResult, VAComponentUsage, ComplianceReport } from '../types';
import { ComponentAnalyzer } from '../analyzer/ComponentAnalyzer';
import { AccessibilityValidator } from '../validators/AccessibilityValidator';
import { DesignSystemChecker } from '../validators/DesignSystemChecker';

export class VAComponentMonitor {
  private config: MonitorConfig;
  private analyzer: ComponentAnalyzer;
  private accessibilityValidator: AccessibilityValidator;
  private designSystemChecker: DesignSystemChecker;

  constructor(config: MonitorConfig = {}) {
    this.config = {
      verbose: false,
      includePatterns: ['**/*.{js,jsx,ts,tsx,vue}'],
      excludePatterns: ['**/node_modules/**', '**/dist/**', '**/*.test.*'],
      accessibilityRules: ['wcag2a', 'wcag2aa'],
      designSystemVersion: 'latest',
      ...config,
    };

    this.analyzer = new ComponentAnalyzer(this.config);
    this.accessibilityValidator = new AccessibilityValidator(this.config);
    this.designSystemChecker = new DesignSystemChecker(this.config);
  }

  /**
   * Scan a project for VA component usage
   */
  async scanProject(projectPath: string, options: { includeAccessibility?: boolean } = {}): Promise<ScanResult> {
    if (this.config.verbose) {
      console.log(`🔍 Scanning project: ${projectPath}`);
    }

    const files = await this.analyzer.findFiles(projectPath);
    const components: VAComponentUsage[] = [];

    for (const file of files) {
      const fileComponents = await this.analyzer.analyzeFile(file);
      
      for (const component of fileComponents) {
        // Validate component compliance
        const designIssues = await this.designSystemChecker.validate(component);
        
        let accessibilityIssues = [];
        if (options.includeAccessibility) {
          accessibilityIssues = await this.accessibilityValidator.validate(component);
        }

        const allIssues = [...designIssues, ...accessibilityIssues];
        
        components.push({
          ...component,
          filePath: file,
          isCompliant: allIssues.length === 0,
          issues: allIssues,
        });
      }
    }

    const summary = {
      totalComponents: components.length,
      compliantComponents: components.filter(c => c.isCompliant).length,
      issuesFound: components.reduce((acc, c) => acc + c.issues.length, 0),
      coveragePercentage: files.length > 0 ? (components.length / files.length) * 100 : 0,
    };

    return {
      projectPath,
      scannedFiles: files,
      components,
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate a specific component
   */
  async validateComponent(componentPath: string, componentName: string): Promise<VAComponentUsage> {
    const components = await this.analyzer.analyzeFile(componentPath);
    const component = components.find(c => c.componentName === componentName);
    
    if (!component) {
      throw new Error(`Component '${componentName}' not found in ${componentPath}`);
    }

    const designIssues = await this.designSystemChecker.validate(component);
    const accessibilityIssues = await this.accessibilityValidator.validate(component);
    const allIssues = [...designIssues, ...accessibilityIssues];

    return {
      ...component,
      filePath: componentPath,
      isCompliant: allIssues.length === 0,
      issues: allIssues,
    };
  }

  /**
   * Generate a comprehensive compliance report
   */
  async generateComplianceReport(projectPath: string, format: 'json' | 'markdown' | 'html' = 'json'): Promise<ComplianceReport | string> {
    const scanResult = await this.scanProject(projectPath, { includeAccessibility: true });
    
    const report: ComplianceReport = {
      overview: {
        projectName: projectPath.split('/').pop() || 'Unknown',
        scanDate: new Date().toISOString(),
        totalFiles: scanResult.scannedFiles.length,
        totalComponents: scanResult.summary.totalComponents,
        complianceScore: scanResult.summary.totalComponents > 0 
          ? (scanResult.summary.compliantComponents / scanResult.summary.totalComponents) * 100 
          : 100,
      },
      components: scanResult.components,
      issues: scanResult.components.flatMap(c => c.issues),
      recommendations: this.generateRecommendations(scanResult),
    };

    if (format === 'json') {
      return report;
    }
    
    // TODO: Implement markdown and HTML formatters
    return JSON.stringify(report, null, 2);
  }

  private generateRecommendations(scanResult: ScanResult): string[] {
    const recommendations: string[] = [];
    
    if (scanResult.summary.complianceScore < 80) {
      recommendations.push('Consider reviewing component usage patterns to improve compliance');
    }
    
    if (scanResult.summary.issuesFound > 0) {
      recommendations.push('Address validation issues to improve accessibility and design system compliance');
    }
    
    return recommendations;
  }
}
