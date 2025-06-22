import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Project, Task, MCPOperation, APIResponse } from '../../shared/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Projects endpoints
app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    // TODO: Implement database query
    const projects: Project[] = [];
    res.json(projects);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/projects', async (req: Request, res: Response) => {
  try {
    // TODO: Implement project creation
    res.json({ message: 'Project creation not implemented yet' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Tasks endpoints
app.get('/api/tasks/:projectId', async (req: Request, res: Response) => {
  try {
    const projectIdParam = req.params.projectId;
    if (!projectIdParam) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    const projectId = parseInt(projectIdParam);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    // TODO: Implement tasks query by project
    const tasks: Task[] = [];
    res.json(tasks);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    // TODO: Implement task creation
    res.json({ message: 'Task creation not implemented yet' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// MCP-specific endpoints for LLM operations
app.post('/mcp/operations', async (req: Request, res: Response) => {
  try {
    const { operation, data }: MCPOperation = req.body;
    
    switch (operation) {
      case 'list_projects':
        // TODO: Implement project listing
        res.json({ result: [] });
        break;
      case 'create_project':
        // TODO: Implement project creation
        res.json({ result: { message: 'Project creation not implemented' } });
        break;
      case 'create_task':
        // TODO: Implement task creation
        res.json({ result: { message: 'Task creation not implemented' } });
        break;
      case 'update_task_dates':
        // TODO: Implement task date updates
        res.json({ result: { message: 'Task update not implemented' } });
        break;
      default:
        res.status(400).json({ error: 'Unknown operation' });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});