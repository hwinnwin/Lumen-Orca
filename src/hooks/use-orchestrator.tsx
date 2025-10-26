/**
 * React hooks for orchestrator state management
 */

import { useState, useEffect, useCallback } from 'react';
import { orchestratorService } from '@/lib/orchestrator-service';
import type { AgentTask, AgentStatus } from '../../packages/agents/src/types';

export function useOrchestrator() {
  const [state, setState] = useState(() => orchestratorService.getState());
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    // Subscribe to updates
    const unsubscribeTasks = orchestratorService.onTaskUpdate(() => {
      setState(orchestratorService.getState());
    });

    const unsubscribeAgents = orchestratorService.onAgentUpdate(() => {
      setState(orchestratorService.getState());
    });

    return () => {
      unsubscribeTasks();
      unsubscribeAgents();
    };
  }, []);

  const start = useCallback(async () => {
    setIsExecuting(true);
    try {
      await orchestratorService.start();
    } finally {
      setIsExecuting(false);
      setState(orchestratorService.getState());
    }
  }, []);

  const reset = useCallback(() => {
    orchestratorService.reset();
    setState(orchestratorService.getState());
  }, []);

  return {
    state,
    isExecuting,
    start,
    reset
  };
}

export function useAgentStates(): AgentStatus[] {
  const [agents, setAgents] = useState<AgentStatus[]>([]);

  useEffect(() => {
    const updateAgents = () => {
      const state = orchestratorService.getState();
      setAgents(state.agents);
    };

    updateAgents();

    const unsubscribe = orchestratorService.onAgentUpdate(updateAgents);
    return unsubscribe;
  }, []);

  return agents;
}

export function useTasks(): AgentTask[] {
  const [tasks, setTasks] = useState<AgentTask[]>([]);

  useEffect(() => {
    const updateTasks = () => {
      const state = orchestratorService.getState();
      setTasks(state.tasks);
    };

    updateTasks();

    const unsubscribe = orchestratorService.onTaskUpdate(updateTasks);
    return unsubscribe;
  }, []);

  return tasks;
}
