#!/usr/bin/env node

/**
 * VA Component Monitor MCP Server
 * 
 * This is the MCP (Model Context Protocol) server entry point.
 * Run this to start the server for integration with Claude or other MCP clients.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { VAComponentMonitor } from '../monitor/VAComponentMonitor.js';
import { program } from 'commander';
import chalk from 'chalk';

// CLI setup
program
  .name('va-component-monitor')
  .description('MCP server for VA component library monitoring')
  .version('0.1.0')
  .option('-p, --port <port>', 'Server port (MCP uses stdio by default)')
  .option('-v, --verbose', 'Verbose logging')
  .parse();

const options = program.opts();

// Initialize the VA Component Monitor
const monitor = new VAComponentMonitor({
  verbose: options.verbose || false,
});

// Create MCP server
const server = new Server(
  {
    name: 'va-component-monitor',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'scan_components',
        description: 'Scan project for VA component usage and compliance',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Project path to scan',
            },
            includeAccessibility: {
              type: 'boolean',
              description: 'Include accessibility validation',
              default: true,
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'validate_component',
        description: 'Validate a specific component against VA design system',
        inputSchema: {
          type: 'object',
          properties: {
            componentPath: {
              type: 'string',
              description: 'Path to component file',
            },
            componentName: {
              type: 'string',
              description: 'Name of VA component to validate',
            },
          },
          required: ['componentPath', 'componentName'],
        },
      },
      {
        name: 'get_compliance_report',
        description: 'Generate comprehensive compliance report',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Project path to analyze',
            },
            format: {
              type: 'string',
              enum: ['json', 'markdown', 'html'],
              description: 'Report format',
              default: 'json',
            },
          },
          required: ['path'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'scan_components': {
        const result = await monitor.scanProject(args.path, {
          includeAccessibility: args.includeAccessibility ?? true,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'validate_component': {
        const result = await monitor.validateComponent(
          args.componentPath,
          args.componentName
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_compliance_report': {
        const result = await monitor.generateComplianceReport(
          args.path,
          args.format || 'json'
        );
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new Error(`Tool execution failed: ${error.message}`);
  }
});

// Start the server
async function main() {
  if (options.verbose) {
    console.log(chalk.blue('🚀 Starting VA Component Monitor MCP Server...'));
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  if (options.verbose) {
    console.log(chalk.green('✅ MCP Server running and ready for connections'));
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (options.verbose) {
    console.log(chalk.yellow('\n🛑 Shutting down MCP Server...'));
  }
  process.exit(0);
});

main().catch((error) => {
  console.error(chalk.red('❌ Failed to start MCP Server:'), error);
  process.exit(1);
});
